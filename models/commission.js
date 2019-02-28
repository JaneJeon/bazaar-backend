const BaseModel = require("./base")
const text = require("../lib/text")
const pickBy = require("lodash/pickBy")

class Commission extends BaseModel {
  static get jsonSchema() {
    return {
      type: "object",
      properties: {
        artistId: { type: "string" },
        isPrivate: { type: "boolean", default: false },
        status: {
          type: "string",
          enum: ["open", "accepted", "rejected", "completed", "cancelled"],
          default: "open"
        },
        cancelledBy: { type: "string", enum: ["artist", "buyer"] },
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
        }
      },
      required: ["price", "deadline", "copyright", "description"],
      additionalProperties: false
    }
  }

  static get relationMappings() {
    return {
      commission_negotiations: {
        relation: BaseModel.HasManyRelation,
        modelClass: "commission_negotiation",
        join: {
          from: "commissions.id",
          to: "commission_negotiations.commission_id"
        }
      },
      negotiations: {
        relation: BaseModel.ManyToManyRelation,
        modelClass: "negotiation",
        join: {
          from: "commissions.id",
          through: {
            from: "commission_negotiations.commission_id",
            to: "commission_negotiations.id"
          },
          to: "negotiations.commission_negotiation_id"
        }
      }
    }
  }

  static get autoFields() {
    return ["isPrivate", "status", "cancelledBy", "tags"]
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

  async negotiate(artistId, obj, trx) {
    const cn = await this.$relatedQuery("commission_negotiations", trx).insert({
      artistId
    })

    const base = pickBy(
      this,
      (v, k) => v !== null && this.constructor.negotiationFields.includes(k)
    )
    // YYYY-MM-DD
    base.deadline = this.deadline.toISOString().substr(0, 10)

    return cn
      .$relatedQuery("negotiations", trx)
      .insert([
        Object.assign(base, { isArtist: false }),
        Object.assign(base, { isArtist: true }, obj)
      ])
  }
}

module.exports = Commission
