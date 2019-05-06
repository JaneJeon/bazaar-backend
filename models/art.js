const BaseModel = require("./base")
const text = require("../lib/text")
const image = require("../lib/image")
const assert = require("assert")
const stripe = require("../lib/stripe")
const pick = require("lodash/pick")

class Art extends BaseModel {
  static get jsonSchema() {
    return {
      type: "object",
      properties: {
        title: {
          type: "string",
          minLength: 1,
          maxLength: process.env.MAX_TITLE_LENGTH
        },
        description: {
          type: "string",
          maxLength: process.env.MAX_DESCRIPTION_LENGTH
        },
        pictures: {
          type: "array",
          items: { type: "string" },
          minItems: 1,
          maxItems: process.env.MAX_PICTURE_ATTACHMENTS
        },
        status: {
          type: "string",
          enum: ["sold", "for sale", "not for sale"],
          default: "not for sale"
        },
        price: { type: "string", pattern: "^\\d+$" },
        priceUnit: { type: "string", enum: ["USD"], default: "USD" },
        tags: { type: "array", items: { type: "string" } }
      },
      required: ["title", "pictures"],
      additionalProperties: false
    }
  }

  static get relationMappings() {
    return {
      favorites: {
        relation: BaseModel.HasManyRelation,
        modelClass: "favorite",
        join: {
          from: "arts.id",
          to: "favorites.art_id"
        }
      },
      favoriteUsers: {
        relation: BaseModel.ManyToManyRelation,
        modelClass: "user",
        join: {
          from: "arts.id",
          through: {
            from: "favorites.art_id",
            to: "favorites.user_id"
          },
          to: "users.id"
        }
      },
      artist: {
        relation: BaseModel.BelongsToOneRelation,
        modelClass: "user",
        join: {
          from: "arts.artist_id",
          to: "users.id"
        }
      },
      transactions: {
        relation: BaseModel.HasManyRelation,
        modelClass: "transaction",
        join: {
          from: "arts.id",
          to: "transactions.art_id"
        }
      }
    }
  }

  static get reservedPostFields() {
    return ["pictures", "tags"]
  }

  static get searchEnabled() {
    return true
  }

  static get QueryBuilder() {
    return class extends BaseModel.QueryBuilder {
      selectWithFavorite(id = null) {
        return this.select(
          "*",
          Art.relatedQuery("favorites")
            .count()
            .as("likes"),
          Art.relatedQuery("favorites")
            .where("user_id", id)
            .count()
            .as("liked"),
          Art.relatedQuery("artist")
            .column("avatar")
            .as("artistAvatar")
        )
      }
    }
  }

  async processInput() {
    if (this.title) this.title = text.clean(this.title)
    if (this.description) {
      this.description = text.clean(this.description, false)
      this.tags = text.extractTags(this.description)
    }
    if (this.pictures)
      this.pictures = await Promise.all(
        this.pictures.map(
          async picture => await image.upload(picture, "PICTURE", "inside")
        )
      )
    if (this.price) {
      this.price -= 0
      assert(this.price >= process.env.MIN_PRICE, 400)
    }
  }

  async $beforeInsert(queryContext) {
    await super.$beforeInsert(queryContext)
    await this.processInput()
  }

  async $beforeUpdate(opt, queryContext) {
    await super.$beforeUpdate(opt, queryContext)
    await this.processInput()
  }

  async purchase(buyerId, stripeCustomerId, trx) {
    const charge = await stripe.charges.create({
      amount: this.price,
      currency: this.priceUnit,
      customer: stripeCustomerId,
      application_fee_amount: 0
    })

    // record the transaction
    await this.$relatedQuery("transactions", trx).insert(
      Object.assign(
        pick(charge, ["id", "object", "amount", "currency", "created"]),
        { artistId: this.artistId, buyerId }
      )
    )

    // update as sold
    return this.$query(trx).patch({ status: "sold" })
  }
}

module.exports = Art
