const BaseModel = require("./base")
const password = require("objection-password")
const { default: visibility } = require("objection-visibility")
const { createHash } = require("crypto")
const normalize = require("normalize-email")
const text = require("../lib/text")
const image = require("../lib/image")
const ses = require("../lib/ses")
const { sync: uid } = require("uid-safe")

class User extends visibility(password()(BaseModel)) {
  static get jsonSchema() {
    return {
      type: "object",
      properties: {
        id: { type: "string" },
        username: {
          type: "string",
          minLength: process.env.MIN_USERNAME_LENGTH,
          maxLength: process.env.MAX_USERNAME_LENGTH,
          pattern: "^\\w+$"
        },
        email: { type: "string", format: "email" },
        password: {
          type: "string",
          minLength: process.env.MIN_PASSWORD_LENGTH
        },
        deleted: { type: "boolean" },
        verified: { type: "boolean", default: false },
        name: { type: "string", maxLength: process.env.MAX_NAME_LENGTH },
        avatar: { type: "string" },
        location: {
          type: "string",
          maxLength: process.env.MAX_LOCATION_LENGTH
        },
        bio: { type: "string", maxLength: process.env.MAX_BIO_LENGTH },
        rating: { type: "integer" },
        stripeAccountId: { type: "string" },
        stripeCustomerId: { type: "string" },
        role: {
          type: "string",
          enum: ["user", "admin", "superuser"],
          default: "user"
        },
        banned: { type: "boolean" }
      },
      required: ["username", "email", "password"],
      additionalProperties: false
    }
  }

  static get hidden() {
    return ["password", "stripeAccountId", "stripeCustomerId", "banned"]
  }

  static get reservedPostFields() {
    return [
      "id",
      "deleted",
      "verified",
      "avatar",
      "stripeAccountId",
      "stripeCustomerId",
      "role",
      "banned"
    ]
  }

  static get reservedPatchFields() {
    return [
      "id",
      "username",
      "deleted",
      "verified",
      "avatar",
      "stripeAccountId",
      "stripeCustomerId",
      "role",
      "banned"
    ]
  }

  static get relationMappings() {
    return {
      arts: {
        relation: BaseModel.HasManyRelation,
        modelClass: "art",
        join: {
          from: "users.id",
          to: "arts.artist_id"
        }
      },
      artsBought: {
        relation: BaseModel.ManyToManyRelation,
        modelClass: "art",
        join: {
          from: "users.id",
          through: {
            from: "transactions.buyer_id",
            to: "transactions.art_id"
          },
          to: "arts.id"
        }
      },
      commissionsAsBuyer: {
        relation: BaseModel.HasManyRelation,
        modelClass: "commission",
        join: {
          from: "users.id",
          to: "commissions.buyer_id"
        }
      },
      commissionsAsArtist: {
        relation: BaseModel.HasManyRelation,
        modelClass: "commission",
        join: {
          from: "users.id",
          to: "commissions.artist_id"
        }
      },
      favoriteArts: {
        relation: BaseModel.ManyToManyRelation,
        modelClass: "art",
        join: {
          from: "users.id",
          through: {
            from: "favorites.user_id",
            to: "favorites.art_id"
          },
          to: "arts.id"
        }
      },
      reviewsAsReviewer: {
        relation: BaseModel.HasManyRelation,
        modelClass: "review",
        join: {
          from: "users.id",
          to: "reviews.reviewer_id"
        }
      },
      reviewsAsReviewee: {
        relation: BaseModel.HasManyRelation,
        modelClass: "review",
        join: {
          from: "users.id",
          to: "reviews.reviewee_id"
        }
      },
      reports: {
        relation: BaseModel.HasManyRelation,
        modelClass: "report",
        join: {
          from: "users.id",
          to: "reports.reporter_id"
        }
      },
      transactionsAsBuyer: {
        relation: BaseModel.HasManyRelation,
        modelClass: "transaction",
        join: {
          from: "users.id",
          to: "transactions.buyer_id"
        }
      },
      transactionsAsArtist: {
        relation: BaseModel.HasManyRelation,
        modelClass: "transaction",
        join: {
          from: "users.id",
          to: "transactions.artist_id"
        }
      }
    }
  }

  static get searchEnabled() {
    return true
  }

  async processInput(opt) {
    if (this.username) this.id = this.username.toLowerCase()
    if (this.email) this.email = normalize(this.email)
    if (this.name) this.name = text.clean(this.name)
    if (this.location) this.location = text.clean(this.location)
    if (this.bio) this.bio = text.clean(this.bio)
    if (!opt || (this.avatar || this.avatar === null))
      this.avatar = await this.generateAvatar(opt)
  }

  async generateAvatar(opt) {
    return this.avatar
      ? await image.upload(this.avatar, "AVATAR", "cover")
      : `https://gravatar.com/avatar/${createHash("md5")
          .update(this.email || opt.old.email)
          .digest("hex")}?s=${process.env.AVATAR_MAX_WIDTH}&d=retro`
  }

  async $beforeInsert(queryContext) {
    await super.$beforeInsert(queryContext)
    await this.processInput()
  }

  async $beforeUpdate(opt, queryContext) {
    await super.$beforeUpdate(opt, queryContext)
    await this.processInput(opt)
  }

  static get QueryBuilder() {
    return class extends super.QueryBuilder {
      findById(id, self) {
        return self && self.id == id
          ? self
          : super
              .findById(id)
              .where("deleted", false)
              .andWhere("banned", false)
      }

      findByEmail(email) {
        return this.findOne({ email: normalize(email) }).throwIfNotFound()
      }
    }
  }

  async sendEmail(Template, data) {
    await ses
      .sendTemplatedEmail({
        Source: process.env.SENDER_ADDRESS,
        Template,
        Destination: { ToAddresses: [this.email] },
        TemplateData: JSON.stringify(data)
      })
      .promise()
  }

  get JWT() {
    const obj = this.toJSON() // convert to POJO
    obj.stripeAccountId = this.stripeAccountId
    obj.stripeCustomerId = this.stripeCustomerId
    obj.jwtid = uid(24)

    return obj
  }

  get isAdmin() {
    return this.role == "admin" || this.role == "superuser"
  }
}

module.exports = User
