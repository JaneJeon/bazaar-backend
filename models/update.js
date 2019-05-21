const BaseModel = require("./base")
const image = require("../lib/image")
const commissionCheckUpdateJob = require("../jobs/commission-check-update")

class Update extends BaseModel {
  static get idColumn() {
    return ["commission_id", "update_num"]
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
      },
      transactions: {
        relation: BaseModel.HasManyRelation,
        modelClass: "transactions",
        join: {
          from: ["updates.commission_id", "updates.update_num"],
          to: ["transactions.commission_id", "transactions.update_num"]
        }
      }
    }
  }

  get jobId() {
    return `${this.commissionId}-${this.updateNum}`
  }

  async processInput() {
    if (this.pictures)
      this.pictures = await Promise.all(
        this.pictures.map(
          async picture => await image.upload(picture, "PICTURE", "inside")
        )
      )
    if (this.pictures || this.waived)
      await commissionCheckUpdateJob.trigger(this.jobId)
  }

  async $beforeUpdate(opt, queryContext) {
    await super.$beforeUpdate(opt, queryContext)
    await this.processInput()
  }
}

module.exports = Update
