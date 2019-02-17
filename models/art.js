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
        tags: { type: "array", items: { type: "string", pattern: "\\w+" } },
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
          from: "arts.artist",
          to: "users.id"
        }
      }
    }
  }

  async processInput() {
    if (this.title) this.title = clean(this.title)
    if (this.description) {
      this.description = clean(this.description, false)
      this.tags = this.description.match(/#\w+/g)
    }
    if (this.pictures)
      this.pictures = await Promise.all(
        this.pictures.map(
          async picture => await image.upload(picture, "picture", "inside")
        )
      )
    if (this.medium) this.medium = clean(this.medium)
  }

  async $beforeInsert(queryContext) {
    await super.$beforeInsert(queryContext)

    this.url = await image.upload(this.url, "picture", "inside")
  }

  static async extractURLs(files) {
    return files.map(file => file.path)
  }
}

module.exports = Art
