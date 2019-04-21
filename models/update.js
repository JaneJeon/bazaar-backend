const BaseModel = require("./base")

class Update extends BaseModel {
  static get idColumn() {
    return ["commission_id", "update_num"]
  }

  static get jsonSchema() {
    return {
      type: "object",
      properties: {
        updateNum: { type: "integer" },
        price: { type: "number" },
        priceUnit: { type: "string" },
        delays: { type: "integer", default: 0 },
        waived: { type: "boolean", default: false },
        deadline: { type: "string", format: "date" },
        pictures: {
          type: "array",
          items: { type: "string" },
          minItems: 1,
          maxItems: process.env.MAX_PICTURE_ATTACHMENTS
        }
      },
      required: [
        "updateNum",
        "price",
        "priceUnit",
        "delays",
        "waived",
        "deadline"
      ],
      additionalProperties: false
    }
  }

  static get relationMappings() {
    return {
      payment: {
        relation: BaseModel.HasOneRelation,
        modelClass: "payment",
        join: {
          from: "updates.payment_id",
          to: "payments.id"
        }
      }
    }
  }
}

module.exports = Update
