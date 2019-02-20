const BaseModel = require("./base")
const { clean } = require("../lib/string")
const image = require("../lib/image")

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
        price: { type: "number", exclusiveMinimum: 0 },
        tags: { type: "array", items: { type: "string" } },
        medium: { type: "string", maxLength: process.env.MAX_MEDIUM_LENGTH }
      },
      required: ["title", "pictures"],
      additionalProperties: false
    }
  }

  static get relationMappings() {
    return {
      artist: {
        relation: BaseModel.BelongsToOneRelation,
        modelClass: require("./user"),
        join: {
          from: "arts.user_id",
          to: "users.id"
        }
      }
    }
  }

  async processInput() {
    if (this.title) this.title = clean(this.title)
    if (this.description) {
      this.description = clean(this.description, false)
      this.tags = this.description
        .match(/#\w+/g)
        .map(str => str.substr(1).toLowerCase())
    }
    if (this.pictures)
      this.pictures = await Promise.all(
        this.pictures.map(
          async picture => await image.upload(picture, "PICTURE", "inside")
        )
      )
    if (this.medium) this.medium = clean(this.medium)
  }

  async $beforeInsert(queryContext) {
    await super.$beforeInsert(queryContext)
    await this.processInput()
  }

  async $beforeUpdate(opt, queryContext) {
    await super.$beforeUpdate(opt, queryContext)
    await this.processInput()
  }
}

module.exports = Art
