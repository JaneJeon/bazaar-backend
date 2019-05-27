var queue = require("../lib/queue")
var taskName = "commissionCancel"
var { transaction } = require("objection")
var { Update, Commission } = require("../models")
var commissionPayoutJob = require("./commission-payout")
var commissionCheckUpdateJob = require("./commission-check-update")
var commissionCheckPaymentJob = require("./commission-check-payment")
var dinero = require("dinero.js")
var slice = require("lodash/slice")
var stripe = require("../lib/stripe")
var debug = require("debug")("bazaar:jobs:commissionCancel")

exports.add = async (data, opts) => {
  if (opts.jobId) opts.jobId = `${taskName}-${opts.jobId}`
  debug("adding job " + opts.jobId || null)

  return queue.add(taskName, data, opts)
}

queue.process(taskName, async (job, data) => {
  await transaction(Update.knex(), async trx => {
    debug("processing job " + job.id)
    debug("job data: %o", job.data)

    // the update from which to refund all
    const commission = await Commission.query(trx).findById(data.commissionId)
    const update = await commission
      .$relatedQuery("updates")
      .where("completed", false)
      .first()

    // force cancel ALL commission jobs!
    // so, so, so fucking disgusting
    const checkPaymentJobIds = [...Array(Commission.maxPaymentLate).keys()].map(
      late => `${commission.id}-${late}`
    )
    const checkUpdateJobIds = [...Array(Commission.numUpdates + 1).keys()].map(
      updateNum => `${commission.id}-${updateNum}`
    )
    const payoutJobIds = checkUpdateJobIds.slice(0) // copy

    debug("checkPaymentJobIds: %o", checkPaymentJobIds)
    debug("checkUpdateJobIds: %o", checkUpdateJobIds)
    debug("payoutJobIds: %o", payoutJobIds)

    await Promise.all([
      commissionCheckPaymentJob.cancelJobs(checkPaymentJobIds),
      commissionCheckUpdateJob.cancelJobs(checkUpdateJobIds),
      commissionPayoutJob.cancelJobs(payoutJobIds)
    ])

    debug("all jobs cancelled!")

    // refund the rest of the payment to B
    const ratio = Commission.updatePriceRatios[commission.numUpdates]
    const alreadyPaid = slice(ratio, 0, update.updateNum).reduce(
      (x, y) => x + y
    )
    const toRefund = slice(ratio, update.updateNum).reduce((x, y) => x + y)

    debug("ratio: " + JSON.stringify(ratio))
    debug(`already paid ${alreadyPaid}, to refund ${toRefund}`)

    const amount = dinero({ amount: commission.price })
      .multiply(1 - process.env.APPLICATION_FEE)
      .allocate([alreadyPaid, toRefund])[1]
      .getAmount()

    const refund = await stripe.refunds.create({
      charge: commission.stripeChargeId,
      amount
    })

    await commission
      .$relatedQuery("transactions", trx)
      .insert(
        stripe.packTransaction(refund, commission.artistId, commission.buyerId)
      )

    debug("refunded " + amount)

    // mark commission as cancelled
    await commission.$query(trx).patch({ status: "cancelled" })

    debug("commission cancelled done")
  })
})
