const BaseModel = require("./base")
const text = require("../lib/text")
const assert = require("http-assert")
const pickBy = require("lodash/pickBy")
const pick = require("lodash/pick")
const isEqual = require("lodash/isEqual")

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
        description: {
          type: "string",
          maxLength: process.env.MAX_DESCRIPTION_LENGTH
        },
        tags: { type: "array", items: { type: "string" } }
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
      },
      artistForms: {
        relation: BaseModel.HasManyRelation,
        modelClass: "negotiation",
        join: {
          from: "commissions.id",
          to: "negotiations.commission_id"
        },
        filter: { isArtist: true }
      }
    }
  }

  static get autoFields() {
    return ["isPrivate", "status", "cancelledBy", "tags"]
  }

  static get negotiationFields() {
    return ["price", "priceUnit", "deadline", "numUpdates", "copyright"]
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

  async requestNegotiation(artistId, trx) {
    // buyer can't create negotiation with themselves, duh
    assert(req.user.id != req.commission.buyerId, 403)

    const base = pickBy(
      this,
      (v, k) => v !== null && this.constructor.negotiationFields.includes(k)
    )
    // YYYY-MM-DD
    base.deadline = this.deadline.toISOString().substr(0, 10)

    return this.$relatedQuery("negotiations", trx).insert([
      // auto-accept for the buyer
      Object.assign({ artistId, isArtist: false, accepted: true }, base),
      Object.assign({ artistId, isArtist: true }, base)
    ])
  }

  // I'm half turned on and half grossed out by this
  async negotiate(artistId, idx, changes = {}, trx) {
    const negotiations = await this.$relatedQuery("negotiations", trx).where(
      "artist_id",
      artistId
    )

    // disallow updates when finalized
    assert(!negotiations[idx].finalized, 405, "Cannot change finalized forms")

    // disallow updates when accepted, except for revoking acceptance
    assert(
      !(negotiations[idx].accepted && changes.accepted !== false),
      405,
      "Cannot change form when it's accepted"
    )

    const forms = negotiations.map(form =>
      pick(form, Commission.negotiationFields)
    )
    const formsAreEqual = isEqual(forms[0], forms[1])

    // don't allow accepting when:
    // 1. the other person has already accepted, and
    // 2. the forms are different
    assert(
      !(changes.accepted && forms[(idx + 1) % 2].accepted && !formsAreEqual),
      405,
      "Cannot accept while the forms are different"
    )

    // do the actual update
    negotiations[idx] = await negotiations[idx]
      .$query(trx)
      .patch(changes)
      .returning("*")
      .first()

    const newForms = negotiations.map(form =>
      pick(form, Commission.negotiationFields)
    )
    const newFormsAreEqual = isEqual(newForms[0], newForms[1])

    // finalize only if both the forms are the same and they both accept
    // and mark the commission as private by setting the artist_id
    if (newForms[0].accepted && newForms[1].accepted && newFormsAreEqual)
      await Promise.all([
        this.$relatedQuery("negotiations", trx)
          .patch({ finalized: true })
          .where("artist_id", artistId),
        this.$query(trx).patch({ artistId })
      ])

    return negotiations
  }
}

module.exports = Commission
