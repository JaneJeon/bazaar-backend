const BaseModel = require("./base")

class Review extends BaseModel {

  static get idColumn() {
    return ["buyer_id", "artist_id, relatedCommission_id"]
  }

  static get jsonSchema() {
    return {
      type: "object",
      properties: {
        description: {
          type: "string",
          maxLength: process.env.MAX_DESCRIPTION_LENGTH
        },
        rating: { type: "integer", minimum: process.env.MIN_PRICE }
      },
      required: ["Description", "rating"],
      additionalProperties: false
    }
  }

  static get relationMappings() {
    return {
      relatedCommission: {
        relation: BaseModel.BelongsToOneRelation,
        modelClass: "commission",
        join: {
          from: "userReview.id",
          to: "commission.id"
        }
      }
    }
  }

}

module.exports = Review
