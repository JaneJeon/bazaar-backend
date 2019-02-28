const { Router } = require("express")
const { Commission, Negotiation } = require("../models")
const assert = require("http-assert")
const { transaction } = require("objection")
const isEqual = require("lodash/isEqual")
const pick = require("lodash/pick")

module.exports = Router()
  .use(async (req, res, next) => {
    req.commission = await Commission.findById(req.params.commissionId)

    if (req.user.id == req.commission.buyerId) req.isArtist = false
    else if (req.user.id == req.commission.artistId) req.isArtist = true

    // if it's private, only the artist and the buyer can access it
    if (req.commission.isPrivate) {
      assert(req.user && req.user.verified, 401)
      next(assert(req.isArtist !== undefined, 403))
    } else next()
  })
  .get("/", async (req, res) => {
    // artist shouldn't be able to access other artists' negotiations
    assert(!req.isArtist, 403)

    // return this commission's negotiations
    // TODO: for now, negotiations are in pairs, so it's tricky to extract
    //  both of them when sorting by anything other than id.
    //  Therefore, we're returning the artists' forms only.
    //  This may change if I ever decide to change the underlying db structure
    //  to accommodate both parties' forms in one record (as a JSON field) -
    //  however, that is tricky since I'd need to update the whole "forms"
    //  field at once even when we're changing only one party's form!!
    const negotiations = await req.commission
      .$relatedQuery("negotiations")
      .skipUndefined()
      .where("is_artist", true)
      .where("updated_at", "<", after)
      .orderBy("updated_at", "desc")
      .limit(process.env.PAGE_SIZE)

    res.send(negotiations)
  })
  .get("/:artistName", async (req, res) => {
    const negotiations = await req.commission
      .$relatedQuery("negotiations")
      .where("negotiation_id", Negotiation.generateId(req.params))

    res.send(negotiations)
  })
  .use((req, res, next) => next(assert(req.user && req.user.verified, 401)))
  .post("/", async (req, res) => {
    // buyer can't create negotiation with themselves, duh
    assert(req.user.id != req.commission.buyerId, 403)

    // negotiation forms for buyer and artist
    const negotiations = await transaction(Negotiation.knex(), async trx => {
      return req.commission.negotiate(req.user.id, trx)
    })

    res.send(negotiations)
  })
  .patch("/:artistName", async (req, res) => {
    Negotiation.filterRequest(req)

    // this us so disgusting
    await transaction(Negotiation.knex(), async trx => {
      const negotiationId = Negotiation.generateId(req.params)
      const idx = req.isArtist + 0
      const negotiations = await req.commission
        .$relatedQuery("negotiations", trx)
        .where("negotiation_id", negotiationId)

      // disallow updates when accepted
      assert(!negotiations[idx].finalized, 405, "Cannot change finalized forms")

      // disallow updates when accepted, except for changing accepted
      assert(
        !(negotiations[idx].accepted && (req.body || {}).accepted !== true),
        405,
        "Cannot change form when it's accepted"
      )

      const forms = negotiations.map(form =>
        pick(form, Commission.negotiationFields)
      )

      // don't allow accepting when the values are different
      assert(
        !((req.body || {}).accepted && !isEqual(forms[0], forms[1])),
        405,
        "Cannot accept while the forms are different"
      )

      // do the actual update
      negotiations[idx] = await negotiations[idx]
        .$query(trx)
        .patch(req.body)
        .returning("*")
        .first()

      forms[idx] = pick(negotiations[idx], Commission.negotiationFields)

      // finalize only if both the forms are the same and they both accept
      if (
        negotiations[0].accepted &&
        negotiations[1].accepted &&
        isEqual(forms)
      )
        await req.commission
          .$relatedQuery("negotiations", trx)
          .patch({ finalized: true })
          .where("negotiation_id", negotiationId)
    })

    res.end()
  })
