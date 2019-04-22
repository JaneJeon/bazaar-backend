const { Router } = require("express")
const { Commission } = require("../models")
const { transaction } = require("objection")
const upload = require("../config/multer")

module.exports = Router({ mergeParams: true })
  .use(async (req, res, next) => {
    req.commission = await Commission.query().findById(req.params.commissionId)

    if (req.user.id == req.commission.buyerId) req.isArtist = false
    else if (req.user.id == req.commission.artistId) req.isArtist = true

    // limit access
    next(assert(req.isArtist !== undefined, 403))
  })
  // endpoint for buyer to actually start the commission
  .post("/", async (req, res) => {
    assert(req.isArtist === false, 403)

    await transaction(Commission.knex(), async trx =>
      req.commission.beginCommission(req.user.stripeCustomerId, trx)
    )

    res.sendStatus(201)
  })
