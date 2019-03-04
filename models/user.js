const BaseModel = require("./base")
const password = require("objection-password-argon2")()
const softDelete = require("objection-soft-delete")()
const { createHash } = require("crypto")
const normalize = require("normalize-email")
const text = require("../lib/text")
const image = require("../lib/image")
const ses = require("../lib/ses")

class User extends password(softDelete(BaseModel)) {
  static get jsonSchema() {
    return {
      type: "object",
      properties: {
        id: { type: "string" },
        username: {
          type: "string",
          minLength: process.env.MIN_USERNAME_LENGTH,
          maxLength: process.env.MAX_USERNAME_LENGTH,
          pattern: "^[\\w ]+$"
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

  static get reservedPostFields() {
    return ["id", "deleted", "verified", "avatar"]
  }

  static get reservedPatchFields() {
    return ["id", "username", "deleted", "verified", "avatar"]
  }

  static get hidden() {
    return ["password", "deleted"]
  }

  async processInput(opt) {
    if (this.username) this.id = text.slugify(this.username)
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
          .digest("hex")}?s=${process.env.AVATAR_SIZE}&d=retro`
  }

  async $beforeInsert(queryContext) {
    await super.$beforeInsert(queryContext)
    await this.processInput()
  }

  async $beforeUpdate(opt, queryContext) {
    await super.$beforeUpdate(opt, queryContext)
    await this.processInput(opt)
  }

  static async findByEmail(email) {
    return this.query()
      .findOne({ email: normalize(email) })
      .whereNotDeleted()
      .throwIfNotFound()
  }

  static async findByUserId(userId, self) {
    return self && self.id == userId ? self : this.findById(userId)
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
}

module.exports = User
