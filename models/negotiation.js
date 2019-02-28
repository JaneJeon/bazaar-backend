const BaseModel = require("./base")

class Negotiation extends BaseModel {
  static get idColumn() {
    return ["negotiation_id", "is_artist"]
  }

  static get jsonSchema() {
    return {
      type: "object",
      properties: {
        negotiationId: { type: "string" },
        isArtist: { type: "boolean" },
        accepted: { type: "boolean", default: false },
        finalized: { type: "boolean", default: false },
        price: { type: "integer", minimum: 5 },
        priceUnit: { type: "string", enum: ["USD"], default: "USD" },
        deadline: { type: "string", format: "date" }, // ISO format
        numUpdates: { type: "integer", minimum: 0, maximum: 5 },
        copyright: {
          type: "string",
          enum: ["artist owns the right", "buyer owns the right"]
        },
        width: { type: "number", exclusiveMinimum: 0 },
        height: { type: "number", exclusiveMinimum: 0 },
        sizeUnit: { type: "string", enum: ["px", "in", "cm"], default: "px" }
      },
      required: ["isArtist", "price", "priceUnit", "deadline", "copyright"],
      additionalProperties: false
    }
  }

  static get autoFields() {
    return ["isArtist", "accepted", "finalized"]
  }

  static generateId(params) {
    return `${params.commission_id}/${params.artist_name.toLowerCase()}`
  }
}

module.exports = Negotiation
