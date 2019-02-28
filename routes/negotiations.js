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
    const negotiations = await req.commission.paginate(
      "negotiations",
      req.query.after,
      "updated_at",
      process.env.PAGE_SIZE * 2
    )

    res.send(negotiations)
  })
  .get("/:artistName", async (req, res) => {
    const negotiations = await req.commission
      .$relatedQuery("negotiations")
      .where("artist_id", req.params.artistName.toLowerCase())

    res.send(negotiations)
  })
  .use((req, res, next) => next(assert(req.user && req.user.verified, 401)))
  .post("/", async (req, res) => {
    // buyer can't create negotiation with themselves, duh
    assert(req.user.id != req.commission.buyerId, 403)
    Negotiation.filterRequest(req)

    // negotiation forms for buyer and artist
    const negotiations = await transaction(Negotiation.knex(), async trx => {
      return req.commission.negotiate(req.user.id, req.body, trx)
    })

    res.send(negotiations)
  })
  .patch("/:artistName", async (req, res) => {
    Negotiation.filterRequest(req)

    // this us so disgusting
    await transaction(Negotiation.knex(), async trx => {
      const artistId = req.params.artistName.toLowerCase()
      const idx = req.isArtist + 1
      const negotiations = await req.commission
        .$relatedQuery("negotiations", trx)
        .where("artist_id", artistId)

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
          .where("artist_id", artistId)
    })

    res.end()
  })
