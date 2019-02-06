const BaseModel = require("./base")

class Picture extends BaseModel {
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
}

module.exports = Picture
