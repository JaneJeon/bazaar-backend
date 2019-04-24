const BaseModel = require("./base")
const image = require("../lib/image")
const commissionCheckUpdateJob = require("../jobs/commission-check-update")

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
        },
        stripeTransfer: { type: "object" },
        stripeRefund: { type: "object" }
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
      commission: {
        relation: BaseModel.BelongsToOneRelation,
        modelClass: "commission",
        join: {
          from: "updates.commission_id",
          to: "commissions.id"
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
    if (this.pictures || this.waived)
      await commissionCheckUpdateJob.trigger(
        `${this.commissionId}-${this.updateNum}`
      )
  }

  async $beforeUpdate(opt, queryContext) {
    await super.$beforeUpdate(opt, queryContext)
    await this.processInput()
  }
}

module.exports = Update
