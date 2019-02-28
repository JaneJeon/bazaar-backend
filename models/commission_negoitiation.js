const BaseModel = require("./base")

class CommissionNegotiation extends BaseModel {
  static get relationMappings() {
    return {
      negotiations: {
        relation: BaseModel.HasManyRelation,
        modelClass: "negotiation",
        join: {
          from: "commission_negotiations.id",
          to: "negotiations.commission_negotiation_id"
        }
      }
    }
  }
}

module.exports = CommissionNegotiation
