const BaseModel = require("./base")
const password = require("objection-password-argon2")()
const softDelete = require("objection-soft-delete")()
const { createHash } = require("crypto")
const normalize = require("normalize-email")
const { clean } = require("../lib/text")
const image = require("../lib/image")

class User extends password(softDelete(BaseModel)) {
  static get jsonSchema() {
    return {
      type: "object",
      properties: {
        username: {
          type: "string",
          minLength: 1,
          maxLength: process.env.MAX_USERNAME_LENGTH,
          pattern: "^\\w+$"
        },
        email: { type: "string", format: "email" },
        password: {
          type: "string",
          minLength: process.env.MIN_PASSWORD_LENGTH
        },
        deleted: { type: "boolean" },
        verified: { type: "boolean" },
        name: { type: "string", maxLength: process.env.MAX_NAME_LENGTH },
        avatar: { type: "string" },
        location: {
          type: "string",
          maxLength: process.env.MAX_LOCATION_LENGTH
        },
        bio: { type: "string", maxLength: process.env.MAX_BIO_LENGTH }
      },
      required: ["username", "email", "password"],
      additionalProperties: false
    }
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
      }
    }
  }

  static get autoFields() {
    return ["deleted", "verified", "avatar"]
  }

  static get hidden() {
    return ["password", "deleted"]
  }

  get gravatar() {
    return `https://gravatar.com/avatar/${createHash("md5")
      .update(this.email)
      .digest("hex")}/?s=${process.env.AVATAR_SIZE}&d=retro`
  }

  async processInput() {
    if (this.username) this.username = this.username.toLowerCase()
    if (this.email) this.email = normalize(this.email)
    if (this.name) this.name = clean(this.name)
    if (this.location) this.location = clean(this.location)
    if (this.bio) this.bio = clean(this.bio)
    if (this.avatar === null) this.avatar = this.gravatar
    else if (this.avatar)
      this.avatar = await image.upload(this.avatar, "AVATAR", "cover")
  }

  async $beforeInsert(queryContext) {
    await super.$beforeInsert(queryContext)
    await this.processInput()
  }

  async $beforeUpdate(opt, queryContext) {
    await super.$beforeUpdate(opt, queryContext)
    await this.processInput()
  }

  static async findByEmail(email) {
    return this.query()
      .findOne({ email: normalize(email) })
      .whereNotDeleted()
      .throwIfNotFound()
  }
}

module.exports = User
