const BaseModel = require("./base")
const { ulid } = require("ulid")

class Negotiation extends BaseModel {
  static get idColumn() {
    return ["commission_id", "artist_id", "is_artist"]
  }

  static get jsonSchema() {
    return {
      type: "object",
      properties: {
        artistId: { type: "string" },
        buyerId: { type: "string" },
        isArtist: { type: "boolean" },
        accepted: { type: "boolean", default: false },
        finalized: { type: "boolean", default: false },
        price: { type: "integer", minimum: process.env.MIN_PRICE },
        priceUnit: { type: "string", enum: ["usd"], default: "usd" },
        deadline: { type: "string", format: "date" }, // ISO format
        numUpdates: { type: "integer", minimum: 0, maximum: 5, default: 0 },
        copyright: {
          type: "string",
          enum: ["artist owns the right", "buyer owns the right"]
        },
        updateId: { type: "string" }
      },
      required: [
        "artistId",
        "buyerId",
        "isArtist",
        "price",
        "deadline",
        "copyright"
      ],
      additionalProperties: false
    }
  }

  static get relationMappings() {
    return {
      chats: {
        relation: BaseModel.HasManyRelation,
        modelClass: "chat",
        join: {
          from: [
            "negotiations.commission_id",
            "negotiations.artist_id",
            "negotiations.is_artist"
          ],
          to: ["chats.commission_id", "chats.artist_id", "chats.dummy_field"]
        }
      },
      artist: {
        relation: BaseModel.BelongsToOneRelation,
        modelClass: "user",
        join: {
          from: "negotiations.artist_id",
          to: "users.id"
        }
      },
      buyer: {
        relation: BaseModel.BelongsToOneRelation,
        modelClass: "user",
        join: {
          from: "negotiations.buyer_id",
          to: "users.id"
        }
      }
    }
  }

  static get autoFields() {
    return ["isArtist", "accepted", "finalized", "updateId"]
  }

  processInput() {
    this.updateId = ulid()
  }

  $beforeInsert(queryContext) {
    super.$beforeInsert(queryContext)
    this.processInput()
  }

  $beforeUpdate(opt, queryContext) {
    super.$beforeUpdate(opt, queryContext)
    this.processInput()
  }

  static get QueryBuilder() {
    return class extends BaseModel.QueryBuilder {
      selectWithAvatars() {
        return this.select(
          "*",
          Negotiation.relatedQuery("artist")
            .column("avatar")
            .as("artistAvatar"),
          Negotiation.relatedQuery("buyer")
            .column("avatar")
            .as("buyerAvatar")
        )
      }
    }
  }
}

module.exports = Negotiation
