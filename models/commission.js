const BaseModel = require("./base")
const text = require("../lib/text")
const assert = require("http-assert")
const pickBy = require("lodash/pickBy")
const pick = require("lodash/pick")
const isEqual = require("lodash/isEqual")
const dayjs = require("dayjs")
const stripe = require("../lib/stripe")
const commissionCheckPaymentJob = require("../jobs/commission-check-payment")
const commissionCheckUpdateJob = require("../jobs/commission-check-update")
const dinero = require("dinero.js")

class Commission extends BaseModel {
  static get jsonSchema() {
    return {
      type: "object",
      properties: {
        artistId: { type: "string" },
        isPrivate: { type: "boolean", default: false },
        status: {
          type: "string",
          enum: [
            "open",
            "accepted",
            "in progress",
            "rejected",
            "completed",
            "cancelled"
          ],
          default: "open"
        },
        price: { type: "integer", minimum: process.env.MIN_PRICE },
        priceUnit: { type: "string", enum: ["usd"], default: "usd" },
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
        deleted: { type: "boolean" }, // TODO: do I need this?
        stripeChargeId: { type: "string" },
        stripeRefundId: { type: "string" }
      },
      required: ["price", "deadline", "copyright", "description"],
      additionalProperties: false
    }
  }

  static get hidden() {
    return ["stripeChargeId", "stripeRefundId"]
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
      updates: {
        relation: BaseModel.HasManyRelation,
        modelClass: "update",
        join: {
          from: "commissions.id",
          to: "updates.commission_id"
        },
        filter: {}
      },
      artist: {
        relation: BaseModel.BelongsToOneRelation,
        modelClass: "user",
        join: {
          from: "commissions.artist_id",
          to: "users.id"
        }
      },
      buyer: {
        relation: BaseModel.BelongsToOneRelation,
        modelClass: "user",
        join: {
          from: "commissions.buyer_id",
          to: "users.id"
        }
      },
      reviews: {
        relation: BaseModel.HasManyRelation,
        modelClass: "review",
        join: {
          from: "commissions.id",
          to: "reviews.commission_id"
        }
      }
    }
  }

  static get reservedPostFields() {
    return [
      "isPrivate",
      "status",
      "cancelledBy",
      "tags",
      "deleted",
      "stripeChargeId",
      "stripeRefundId"
    ]
  }

  static get negotiationFields() {
    return ["price", "priceUnit", "deadline", "numUpdates", "copyright"]
  }

  static get searchEnabled() {
    return true
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

  static get QueryBuilder() {
    return class extends BaseModel.QueryBuilder {
      selectWithAvatars() {
        return this.select(
          "*",
          Commission.relatedQuery("artist")
            .column("avatar")
            .as("artistAvatar"),
          Commission.relatedQuery("buyer")
            .column("avatar")
            .as("buyerAvatar")
        )
      }
    }
  }

  async beginNegotiation(isBuyer, artistId, buyerId) {
    // buyer can't create negotiation with themselves, duh
    assert(!isBuyer, 403)

    const base = pickBy(
      this,
      (v, k) => v !== null && this.constructor.negotiationFields.includes(k)
    )

    return this.$relatedQuery("negotiations").insert([
      // auto-accept for the buyer
      Object.assign({ artistId, buyerId, isArtist: false }, base),
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
    ) {
      const updates = await Promise.all([
        negotiations[0].$query(trx).patch({ finalized: true }),
        negotiations[1].$query(trx).patch({ finalized: true }),
        this.$query(trx).patch(
          Object.assign({ artistId, status: "accepted" }, forms[0])
        )
      ])

      negotiations = updates.slice(0, 2)

      // add job only when the finalization is confirmed to work, since
      // we don't keep track of jobs in our database
      await commissionCheckPaymentJob.add(
        { commissionId: this.id, late: 0 },
        { delay: 24 * 60 * 60 * 1000, jobId: `${this.id}-0` } // schedule to be run in 24h
      )
    }

    return negotiations
  }

  get transferGroup() {
    return `commission-${this.id}`
  }

  static get updatePriceRatios() {
    return [
      [5, 5],
      [4, 2, 4],
      [3, 2, 2, 3],
      [2, 2, 2, 2, 2],
      [1, 2, 2, 2, 2, 1]
    ]
  }

  // pays for the commission, adds update rows, and kickstarts update jobs
  async beginCommission(stripeCustomerId, trx) {
    const charge = await stripe.charges.create({
      amount: this.price,
      currency: this.priceUnit,
      transfer_group: this.transferGroup,
      customer: stripeCustomerId
    })

    await this.$query(trx).patch({
      status: "in progress",
      stripeChargeId: charge.id
    })

    const updateRows = []
    const now = dayjs()
    const days = dayjs(this.deadline).diff(now, "day")

    // take application fees up front
    this.price = dinero({ amount: this.price }).multiply(
      1 - process.env.APPLICATION_FEE
    )

    const prices = dinero({ amount: this.price })
      .multiply(1 - process.env.APPLICATION_FEE)
      .allocate(this.constructor.updatePriceRatios[this.numUpdates])

    for (let i = 0; i <= this.numUpdates; i++) {
      const update = {
        updateNum: i,
        price: prices[i].getAmount(),
        priceUnit: this.priceUnit,
        deadline: dayjs()
          .add(Math.ceil((i * days) / this.numUpdates), "day")
          .format("YYYY-MM-DD")
      }

      // first hit is free!
      if (i == 0) update.pictures = [""]

      updateRows.push(update)
    }

    const updates = await this.$relatedQuery("updates", trx).insert(updateRows)

    // put jobs after all db queries are done for safety
    await Promise.all(
      updateRows.map(update =>
        commissionCheckUpdateJob.add(
          {
            commissionId: this.id,
            updateNum: update.updateNum,
            late: 0
          },
          {
            delay: dayjs(update.deadline).diff(now),
            jobId: update.jobId
          }
        )
      )
    )

    return updates
  }

  static get maxPaymentLate() {
    return 2
  }
}

module.exports = Commission
