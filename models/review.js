const BaseModel = require("./base")

class Review extends BaseModel {
  static get jsonSchema() {
    return {
      type: "object",
      properties: {
        reviewer_id: {type: 'string'},
        reviewee_id: {type: 'string'},
        description: {
          type: "string",
          maxLength: process.env.MAX_DESCRIPTION_LENGTH
        },
        rating: { type: "integer", minimum: 1, maximum: 5 }
      },
      required: ["Description", "rating"],
      additionalProperties: false
    }
  }

  static get reservedPostFields() {
    return ['reviewer_id', 'reviewee_id']
  }

  static get searchEnabled() {
    return true
  }
}

module.exports = Review
