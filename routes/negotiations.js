const { Router } = require("express")
const { Commission, Negotiation } = require("../models")
const assert = require("http-assert")

module.exports = Router()
  .use(async (req, res, next) => {
    req.commission = await Commission.findById(req.params.commissionId)

    // if it's private, only the artist and the buyer can access it
    if (req.commission.isPrivate) {
      assert(req.user && req.user.verified, 401)
      next(
        assert(
          req.user.id == req.commission.buyerId ||
            req.user.id == req.commission.artistId,
          403
        )
      )
    } else next()
  })
  .get("/", async (req, res) => {
    // return this commission's negotiations
    const negotiations = await req.commission.paginate(
      "negotiations",
      req.query.after
    )

    res.send(negotiations)
  })
  .get("/:negotiationId", async (req, res) => {
    const negotiation = await req.commission.findById(
      "negotiations",
      req.params.negotiationId
    )

    res.send(negotiation)
  })
  .use((req, res, next) => next(assert(req.user && req.user.verified, 401)))
  .post("/", async (req, res) => {
    // buyer can't create negotiation with themselves, duh
    assert(req.user.id != req.commission.buyerId, 403)
    Negotiation.filterRequest(req)

    // negotiation forms for buyer and artist
    const negotiations = await req.commission.negotiate(req.user.id, req.body)

    res.send(negotiations)
  })
