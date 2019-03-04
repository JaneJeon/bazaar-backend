const BaseModel = require("./base")
const text = require("../lib/text")
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
        price: { type: "number", minimum: process.env.MIN_PRICE },
        priceUnit: { type: "string", enum: ["USD"], default: "USD" },
        tags: { type: "array", items: { type: "string" } }
      },
      required: ["title", "pictures"],
      additionalProperties: false
    }
  }

  static get reservedPostFields() {
    return ["pictures", "tags"]
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
