const BaseModel = require("./base")
const Password = require("objection-password-argon2")
const softDelete = require("objection-soft-delete")
const normalize = require("normalize-email")

class User extends softDelete()(Password()(BaseModel)) {
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
        verified: { type: "boolean" }
      },
      required: ["username", "email", "password"],
      additionalProperties: false
    }
  }

  static get visible() {
    return ["id", "username", "verified"]
  }

  static normalizeEmail(email) {
    return normalize(email)
  }

  $beforeInsert(queryContext) {
    super.$beforeInsert(queryContext)
    this.username = this.username.toLowerCase()
    this.email = User.normalizeEmail(this.email)
  }

  $beforeUpdate(opt, queryContext) {
    super.$beforeUpdate(opt, queryContext)
    if (this.username) this.username = this.username.toLowerCase()
    if (this.email) this.email = User.normalizeEmail(this.email)
  }
}

module.exports = User
