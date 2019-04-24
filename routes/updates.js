const { Router } = require("express")
const { Commission, Payment } = require("../models")
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

    const updates = await transaction(Commission.knex(), async trx =>
      req.commission.beginCommission(req.user.stripeCustomerId, trx)
    )

    res.status(201).send(updates)
  })
  // TODO: transaction-ify
  .patch(
    "/:updateNum",
    upload.array("pictures", process.env.MAX_PICTURE_ATTACHMENTS),
    async (req, res) => {
      assert(req.isArtist, 403)

      let update = await Payment.query().findById([
        req.params.commissionId,
        req.params.updateNum
      ])

      update = await update
        .$query()
        .patch({ pictures: Array.from(req.files).map(file => file.path) })

      res.send(update)
    }
  )
  .patch("/:updateNum/waive", async (req, res) => {
    assert(req.isArtist === false, 403)

    const update = await Payment.query().findById([
      req.params.commissionId,
      req.params.updateNum
    ])

    await update.$query().patch({ waived: true })

    res.end()
  })
