const { Router } = require("express")
const { Commission } = require("../models")
const { transaction } = require("objection")
const upload = require("../config/multer")
const commissionPayoutJob = require("../jobs/commission-payout")
const assert = require("http-assert")
const { ensureIsVerified, ensureHasPayment } = require("../lib/middlewares")

module.exports = Router({ mergeParams: true })
  .use(ensureIsVerified)
  .use(async (req, res, next) => {
    req.commission = await Commission.query().findById(req.params.commissionId)

    if (req.user.id == req.commission.buyerId) req.isArtist = false
    else if (req.user.id == req.commission.artistId) req.isArtist = true

    // limit access
    next(assert(req.isArtist !== undefined, 403))
  })
  .get("/:updateNum", async (req, res) => {
    const update = await req.commission
      .$relatedQuery("updates")
      .findOne({ updateNum: req.params.updateNum })

    if (
      !req.isArtist &&
      !update.waived &&
      update.pictures &&
      !update.stripeTransfer
    ) {
      // trigger job to be run NOW and wait until it's done
      await commissionPayoutJob.complete(update.jobId)
    }

    res.send(update)
  })
  .get("/:updateNum/transactions", async (req, res) => {
    const update = await req.commission
      .$relatedQuery("updates")
      .findOne({ updateNum: req.params.updateNum })
    const transactions = await update
      .$relatedQuery("transactions")
      .selectWithAvatars()
      .paginate(req.query.after)

    res.send(transactions)
  })
  // endpoint for buyer to actually start the commission
  .post("/", ensureHasPayment, async (req, res) => {
    assert(req.isArtist === false, 403)

    const updates = await transaction(Commission.knex(), async trx =>
      req.commission.beginCommission(
        req.user.stripeCustomerId,
        req.body.source,
        trx
      )
    )

    res.status(201).send(updates)
  })
  .patch(
    "/:updateNum",
    upload.array("pictures", process.env.MAX_PICTURE_ATTACHMENTS),
    async (req, res) => {
      assert(req.isArtist, 403)

      let update = await req.commission
        .$relatedQuery("updates")
        .findOne({ updateNum: req.params.updateNum })

      update = await update
        .$query()
        .patch({ pictures: Array.from(req.files).map(file => file.path) })

      res.send(update)
    }
  )
  .patch("/:updateNum/waive", async (req, res) => {
    assert(req.isArtist === false, 403)

    let update = await req.update
      .$relatedQuery("updates")
      .findOne({ updateNum: req.params.updateNum })

    await update.$query().patch({ waived: true })

    res.end()
  })
