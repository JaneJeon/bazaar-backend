const BaseModel = require("./base")
const text = require("../lib/text")

class Commission extends BaseModel {
  static get jsonSchema() {
    return {
      type: "object",
      properties: {
        artist_id: { type: "integer", exclusiveMinimum: 0 },
        status: {
          type: "string",
          enum: ["created", "accepted", "rejected", "completed", "cancelled"],
          default: "created"
        },
        price: { type: "number", exclusiveMinimum: 0 },
        price_unit: { type: "string", enum: ["USD"], default: "USD" },
        deadline: { type: "string", format: "date-time" }, // ISO format
        num_updates: { type: "integer", minimum: 0, maximum: 5 },
        copyright: {
          type: "string",
          enum: ["artist owns the right", "buyer owns the right"]
        },
        width: { type: "number", exclusiveMinimum: 0 },
        height: { type: "number", exclusiveMinimum: 0 },
        size_unit: { type: "string", enum: ["px", "in", "cm"], default: "px" },
        tags: { type: "array", items: { type: "string" } },
        description: {
          type: "string",
          maxLength: process.env.MAX_DESCRIPTION_LENGTH
        }
      },
      required: ["price", "price_unit", "deadline", "copyright", "description"],
      additionalProperties: false
    }
  }

  processInput() {
    if (this.description) {
      this.description = text.clean(this.description, false)
      this.tags = text.extractTags(this.description)
    }
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

module.exports = Commission
