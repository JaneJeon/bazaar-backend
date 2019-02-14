const BaseModel = require("./base")
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
        url: { type: "string" }
      },
      required: ["title", "url"],
      additionalProperties: false
    }
  }

  async $beforeInsert(queryContext) {
    await super.$beforeInsert(queryContext)

    this.url = await image.upload(this.url, "picture", "inside")
  }
}

module.exports = Art
