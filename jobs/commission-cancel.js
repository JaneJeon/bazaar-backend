const queue = require("../lib/queue")
const taskName = "commissionCancel"
const { transaction } = require("objection")
const { Update, Commission } = require("../models")
const commissionPayoutJob = require("./commission-payout")
const commissionCheckUpdateJob = require("./commission-check-update")
const commissionCheckPaymentJob = require("./commission-check-payment")
const dinero = require("dinero.js")
const slice = require("lodash/slice")
const stripe = require("../lib/stripe")

exports.add = async (data, opts) => queue.add(taskName, data, opts)

queue.process(taskName, async (job, data) => {
  await transaction(Update.knex(), async trx => {
    // the update from which to refund all
    const update = await Update.query(trx)
      .findById([data.commissionId, data.updateNum])
      .eager({ commission: true })
    const commission = update.commission

    // force cancel ALL commission jobs!
    // so, so, so fucking disgusting
    const checkPaymentJobIds = [...Array(Commission.maxPaymentLate).keys()].map(
      late => `${commission.id}-${late}`
    )
    const checkUpdateJobIds = [...Array(Commission.numUpdates + 1).keys()].map(
      updateNum => `${commission.id}-${updateNum}`
    )
    const payoutJobIds = checkUpdateJobIds.slice(0) // copy

    await Promise.all([
      commissionCheckPaymentJob.cancelJobs(checkPaymentJobIds),
      commissionCheckUpdateJob.cancelJobs(checkUpdateJobIds),
      commissionPayoutJob.cancelJobs(payoutJobIds)
    ])

    // refund the rest of the payment to B
    const ratio = Commission.updatePriceRatios[commission.numUpdates]
    const alreadyPaid = slice(ratio, 0, update.updateNum).reduce(
      (x, y) => x + y
    )
    const toRefund = slice(ratio, update.updateNum).reduce((x, y) => x + y)

    const amount = dinero({ amount: commission.price })
      .multiply(1 - process.env.APPLICATION_FEE)
      .allocate([alreadyPaid, toRefund])[1]
      .getAmount()

    const refund = await stripe.refunds.create({
      charge: commission.stripeChargeId,
      amount
    })

    // mark commission as cancelled
    await commission
      .$query(trx)
      .patch({ status: "cancelled", stripeRefundId: refund.id })
  })
})
