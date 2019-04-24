const queue = require("../lib/queue")
const taskName = "commissionPayout"
const { transaction } = require("objection")
const { Update } = require("../models")
const stripe = require("../lib/stripe")

exports.add = async (data, opts) => {
  if (opts.jobId) opts.jobId = `${taskName}-${opts.jobId}`
  return queue.add(taskName, data, opts)
}

exports.complete = async jobId => {
  const job = await queue.getJob(`${taskName}-${jobId}`)

  if (job !== null) {
    await job.promote()
    await job.finished()
  }
}

queue.process(taskName, async (job, data) => {
  await transaction(Update.knex(), async trx => {
    const update = await Update.query(trx)
      .findById([data.commissionId, data.updateNum])
      .eager({ commission: { artist: true } })

    const penalty = (update.commission.price / 20) * update.delays // 5%

    // pay out the artist
    const stripeTransfer = await stripe.transfers.create({
      amount: update.price - penalty,
      currency: update.priceUnit,
      destination: update.commission.artist.stripeAccountId,
      transfer_group: update.commission.transferGroup
    })

    // if the artist is late, refund certain amount to the buyer
    if (penalty)
      var stripeRefund = await stripe.refunds.create({
        charge: update.commission.stripeCharge.id,
        amount: penalty
      })

    // record payments
    await update
      .$query(trx)
      .patch({ stripeTransfer, ...(stripeRefund & { stripeRefund }) })

    // if final, mark commission 'complete'
    if (update.updateNum == commission.numUpdates)
      await update.commission.$query(trx).patch({ status: "complete" })
  })
})
