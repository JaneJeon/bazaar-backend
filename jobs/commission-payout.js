const queue = require("../lib/queue")
const taskName = "commissionPayout"
const { transaction } = require("objection")
const { Update } = require("../models")
const stripe = require("../lib/stripe")
const dinero = require("dinero.js")
const debug = require("debug")("bazaar:jobs:commissionPayout")

exports.add = async (data, opts) => {
  if (opts.jobId) opts.jobId = `${taskName}-${opts.jobId}`
  debug("adding job " + opts.jobId || null)

  return queue.add(taskName, data, opts)
}

exports.complete = async jobId => {
  debug("immediately completing job " + jobId)
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
    debug("processing job " + job.id)
    debug("job data: %o", job.data)

    const update = await Update.query(trx)
      .findById([data.commissionId, data.updateNum])
      .eager({ commission: { artist: true } })
    const commission = update.commission
    const artist = commission.artist

    const prices = dinero({ amount: update.price }).allocate([
      20 - 5 * update.delays,
      5 * update.delays
    ])

    debug("prices: %o", prices)

    // pay out the artist
    const transfer = await stripe.transfers.create({
      amount: prices[0].getAmount(),
      currency: update.priceUnit,
      destination: artist.stripeAccountId,
      transfer_group: commission.transferGroup
    })

    // record the transaction
    await update
      .$relatedQuery("transactions", trx)
      .insert(
        stripe.packTransaction(
          transfer,
          commission.artistId,
          commission.buyerId
        )
      )

    debug("paid artist")

    // if the artist is late, refund certain amount to the buyer
    if (update.delays) {
      const refund = await stripe.refunds.create({
        charge: commission.stripeCharge.id,
        amount: prices[1].getAmount()
      })

      await update
        .$relatedQuery("transactions", trx)
        .insert(
          stripe.packTransaction(
            refund,
            commission.artistId,
            commission.buyerId
          )
        )

      debug("refunded buyer")
    }

    // if final, mark commission 'complete'
    if (update.updateNum == commission.numUpdates)
      await commission.$query(trx).patch({ status: "complete" })
  })
})
