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
        price: { type: "integer", minimum: process.env.MIN_PRICE },
        priceUnit: { type: "string", enum: ["USD"], default: "USD" },
        deadline: { type: "string", format: "date" }, // ISO format
        numUpdates: { type: "integer", minimum: 0, maximum: 5, default: 0 },
        copyright: {
          type: "string",
          enum: ["artist owns the right", "buyer owns the right"]
        },
        description: {
          type: "string",
          maxLength: process.env.MAX_DESCRIPTION_LENGTH
        },
        tags: { type: "array", items: { type: "string" } },
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
      },
      artistForms: {
        relation: BaseModel.HasManyRelation,
        modelClass: "negotiation",
        join: {
          from: "commissions.id",
          to: "negotiations.commission_id"
        },
        filter: { is_artist: true }
      },
      commissionReviews: {
        relation: BaseModel.HasManyRelation,
        modelClass: "review",
        join: {
          from: "commissions.id",
          to: "reviews.id"
        }
      },
      payments: {
        relation: BaseModel.HasManyRelation,
        modelClass: "payment",
        join: {
          from: "commissions.id",
          to: "payments.commission_id"
        }
      },
      updates: {
        relation: BaseModel.HasManyRelation,
        modelClass: "update",
        join: {
          from: "commissions.id",
          to: "updates.commission_id"
        }
      }
    }
  }

  static get reservedPostFields() {
    return ["isPrivate", "status", "cancelledBy", "tags", "deleted"]
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

  async beginNegotiation(isBuyer, artistId, buyerId) {
    // buyer can't create negotiation with themselves, duh
    assert(!isBuyer, 403)

    const base = pickBy(
      this,
      (v, k) => v !== null && this.constructor.negotiationFields.includes(k)
    )
    // YYYY-MM-DD
    base.deadline = this.deadline.toISOString().substr(0, 10)

    return this.$relatedQuery("negotiations").insert([
      // auto-accept for the buyer
      Object.assign(
        { artistId, buyerId, isArtist: false, accepted: true },
        base
      ),
      Object.assign({ artistId, buyerId, isArtist: true }, base)
    ])
  }

  // I'm half turned on and half grossed out by this
  async negotiate(artistId, idx, changes = {}, trx) {
    let negotiations = await this.$relatedQuery("negotiations", trx)
      .where("artist_id", artistId)
      .orderBy("is_artist")

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

    // don't allow accepting when the forms are different
    assert(
      !((changes[idx] || {}).accepted === true && !formsAreEqual),
      405,
      "Cannot accept while the forms are different"
    )

    // do the actual update
    negotiations[idx] = await negotiations[idx].$query(trx).patch(changes)

    forms[idx] = pick(negotiations[idx], Commission.negotiationFields)
    const newFormsAreEqual = isEqual(forms[0], forms[1])

    // finalize only if both the forms are the same and they both accept
    // and mark the commission as private by setting the artist_id
    if (
      negotiations[0].accepted &&
      negotiations[1].accepted &&
      newFormsAreEqual
    )
      [negotiations] = await Promise.all([
        this.$relatedQuery("negotiations", trx)
          .where("artist_id", artistId)
          .patch({ finalized: true }),
        this.$query(trx).patch(Object.assign({ artistId }, forms[0]))
      ])

    return negotiations
  }
}

module.exports = Commission
