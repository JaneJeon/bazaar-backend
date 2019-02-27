const BaseModel = require("./base")

class Negotiation extends BaseModel {
  static get idColumn() {
    return ["commission_id", "artist_id", "user_type"]
  }

  static get jsonSchema() {
    return {
      type: "object",
      properties: {
        artist_id: { type: "integer", minimum: 1 },
        user_type: { type: "string", enum: ["artist", "buyer"] },
        accepted: { type: "boolean", default: false },
        price: { type: "integer", minimum: 5 },
        price_unit: { type: "string", enum: ["USD"], default: "USD" },
        deadline: { type: "string", format: "date" }, // ISO format
        num_updates: { type: "integer", minimum: 0, maximum: 5 },
        copyright: {
          type: "string",
          enum: ["artist owns the right", "buyer owns the right"]
        },
        width: { type: "number", exclusiveMinimum: 0 },
        height: { type: "number", exclusiveMinimum: 0 },
        size_unit: { type: "string", enum: ["px", "in", "cm"], default: "px" }
      },
      required: ["artist_id", "user_type", "price", "deadline", "copyright"],
      additionalProperties: false
    }
  }
}

module.exports = Negotiation
