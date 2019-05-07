const BaseModel = require("./base")

class Transaction extends BaseModel {
  static get relationMappings() {
    return {
      reports: {
        relation: BaseModel.HasManyRelation,
        modelClass: "report",
        join: {
          from: "transactions.id",
          to: "reports.transaction_id"
        }
      },
      artist: {
        relation: BaseModel.BelongsToOneRelation,
        modelClass: "user",
        join: {
          from: "transactions.artist_id",
          to: "users.id"
        }
      },
      buyer: {
        relation: BaseModel.BelongsToOneRelation,
        modelClass: "user",
        join: {
          from: "transactions.buyer_id",
          to: "users.id"
        }
      }
    }
  }

  static get QueryBuilder() {
    return class extends BaseModel.QueryBuilder {
      selectWithAvatars() {
        return this.select(
          "*",
          Transaction.relatedQuery("artist")
            .column("avatar")
            .as("artist.avatar"),
          Transaction.relatedQuery("buyer")
            .column("avatar")
            .as("buyer.avatar")
        )
      }
    }
  }
}

module.exports = Transaction
