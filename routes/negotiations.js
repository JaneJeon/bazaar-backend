const { Router } = require("express")
const { Commission, Negotiation } = require("../models")
const assert = require("http-assert")
const { transaction } = require("objection")
const { ensureIsVerified } = require("../lib/middlewares")

module.exports = Router({ mergeParams: true })
  .use(ensureIsVerified)
  .use(async (req, res, next) => {
    req.commission = await Commission.query().findById(req.params.commissionId)

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
      .$relatedQuery("artistForms")
      .selectWithAvatars()
      .paginate(req.query.after, "update_id")

    res.send(negotiations)
  })
  .get("/:artistId", async (req, res) => {
    const negotiations = await req.commission
      .$relatedQuery("negotiations")
      .selectWithAvatars()
      .where("artist_id", req.params.artistId)

    res.send(negotiations)
  })
  .use((req, res, next) => next(assert(req.commission.status == "open", 405)))
  .post("/", async (req, res) => {
    // negotiation forms for buyer and artist
    // TODO: transaction-ify
    const negotiations = await req.commission.beginNegotiation(
      req.isBuyer,
      req.user.id,
      req.commission.buyerId
    )

    res.status(201).send(negotiations)
  })
  .patch("/:artistId", async (req, res) => {
    Negotiation.filterPatch(req.body)

    const negotiations = await transaction(Negotiation.knex(), async trx => {
      return req.commission.negotiate(
        req.params.artistId,
        req.isArtist === undefined ? 1 : req.isArtist + 0,
        req.body,
        trx
      )
    })

    res.send(negotiations)
  })
