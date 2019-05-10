const BaseModel = require("./base")

class Review extends BaseModel {
  static get jsonSchema() {
    return {
      type: "object",
      properties: {
        reviewerId: { type: "string" },
        revieweeId: { type: "string" },
        description: {
          type: "string",
          maxLength: process.env.MAX_DESCRIPTION_LENGTH
        },
        rating: { type: "integer", minimum: 1, maximum: 5 }
      },
      required: ["description", "rating"],
      additionalProperties: false
    }
  }

  static get reservedPostFields() {
    return ["reviewerId", "revieweeId"]
  }

  static get searchEnabled() {
    return true
  }
}

module.exports = Review
