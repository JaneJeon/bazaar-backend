const BaseModel = require("./base")
const softDelete = require("objection-soft-delete")()
const text = require("../lib/text")
const pickBy = require("lodash/pickBy")

class Commission extends softDelete(BaseModel) {
  static get jsonSchema() {
    return {
      type: "object",
      properties: {
        artistId: { type: "string" },
        isPrivate: { type: "boolean", default: false },
        status: {
          type: "string",
          enum: ["created", "accepted", "rejected", "completed", "cancelled"],
          default: "created"
        },
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
        sizeUnit: { type: "string", enum: ["px", "in", "cm"], default: "px" },
        tags: { type: "array", items: { type: "string" } },
        description: {
          type: "string",
          maxLength: process.env.MAX_DESCRIPTION_LENGTH
        },
        deleted: { type: "boolean" }
      },
      required: ["price", "deadline", "copyright", "description"],
      additionalProperties: false
    }
  }

  static get relationMappings() {
    return {
      negotiations: {
        relation: BaseModel.HasManyRelation,
        modelClass: "negotiation",
        join: {
          from: "commissions.id",
          to: "negotiations.commission_id"
        }
      }
    }
  }

  static get autoFields() {
    return ["isPrivate", "status", "tags", "deleted"]
  }

  static get hidden() {
    return ["deleted"]
  }

  static get negotiationFields() {
    return [
      "price",
      "priceUnit",
      "deadline",
      "numUpdates",
      "copyright",
      "width",
      "height",
      "sizeUnit"
    ]
  }

  processInput() {
    if (this.artistId) this.isPrivate = true
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

  async negotiate(artistId, obj) {
    const base = pickBy(
      this,
      (v, k) => v !== null && this.constructor.negotiationFields.includes(k)
    )
    base.artistId = artistId
    base.deadline = this.deadline.toISOString().substr(0, 10)

    return Promise.all([
      this.$relatedQuery("negotiations").insert(
        Object.assign(base, { userType: "buyer" })
      ),
      this.$relatedQuery("negotiations").insert(
        Object.assign(base, { userType: "artist" }, obj)
      )
    ])
  }
}

module.exports = Commission
