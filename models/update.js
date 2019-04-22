const BaseModel = require("./base")
const image = require("../lib/image")

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

  async processInput() {
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

module.exports = Update
