const BaseModel = require("./base")
const { ulid } = require("ulid")

class Negotiation extends BaseModel {
  static get idColumn() {
    return ["commission_id", "artist_id", "is_artist"]
  }

  static get jsonSchema() {
    return {
      type: "object",
      properties: {
        artistId: { type: "string" },
        buyerId: { type: "string" },
        isArtist: { type: "boolean" },
        accepted: { type: "boolean", default: false },
        finalized: { type: "boolean", default: false },
        price: { type: "integer", minimum: process.env.MIN_PRICE },
        priceUnit: { type: "string", enum: ["USD"], default: "USD" },
        deadline: { type: "string", format: "date" }, // ISO format
        numUpdates: { type: "integer", minimum: 0, maximum: 5, default: 0 },
        copyright: {
          type: "string",
          enum: ["artist owns the right", "buyer owns the right"]
        },
        updateId: { type: "string" }
      },
      required: [
        "artistId",
        "buyerId",
        "isArtist",
        "price",
        "deadline",
        "copyright"
      ],
      additionalProperties: false
    }
  }

  static get relationMappings() {
    return {
      chats: {
        relation: BaseModel.HasManyRelation,
        modelClass: "chat",
        join: {
          from: [
            "negotiations.commission_id",
            "negotiations.artist_id",
            "negotiations.is_artist"
          ],
          to: ["chats.commission_id", "chats.artist_id", "chats.dummy_field"]
        }
      }
    }
  }

  static get autoFields() {
    return ["isArtist", "accepted", "finalized", "updateId"]
  }

  processInput() {
    this.updateId = ulid()
  }

  $beforeInsert(queryContext) {
    super.$beforeInsert(queryContext)
    this.processInput()
  }

  $beforeUpdate(opt, queryContext) {
    super.$beforeUpdate(opt, queryContext)
    this.processInput()
  }
}

module.exports = Negotiation
