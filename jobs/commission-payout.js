const queue = require("../lib/queue")
const taskName = "commissionPayout"
const { transaction } = require("objection")
const { Update } = require("../models")
const stripe = require("../lib/stripe")
const dinero = require("dinero.js")

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

exports.cancelJobs = async ids => {
  const jobs = await Promise.all(
    ids.map(id => queue.getJob(`${taskName}-${id}`))
  )

  await Promise.all(jobs.filter(v => v).map(job => job.remove()))
}

queue.process(taskName, async (job, data) => {
  await transaction(Update.knex(), async trx => {
    const update = await Update.query(trx)
      .findById([data.commissionId, data.updateNum])
      .eager({ commission: { artist: true } })
    const commission = update.commission
    const artist = commission.artist

    const prices = dinero({ amount: update.price }).allocate([
      20 - 5 * update.delays,
      5 * update.delays
    ])

    // pay out the artist
    const transfer = await stripe.transfers.create({
      amount: prices[0].getAmount(),
      currency: update.priceUnit,
      destination: artist.stripeAccountId,
      transfer_group: commission.transferGroup
    })

    const changes = { stripeTransferId: transfer.id }

    // if the artist is late, refund certain amount to the buyer
    if (update.delays) {
      const refund = await stripe.refunds.create({
        charge: commission.stripeCharge.id,
        amount: prices[1].getAmount()
      })

      changes.stripeRefundId = refund.id
    }

    // record payments
    await update.$query(trx).patch(changes)

    // if final, mark commission 'complete'
    if (update.updateNum == commission.numUpdates)
      await commission.$query(trx).patch({ status: "complete" })
  })
})
