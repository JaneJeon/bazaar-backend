const queue = require("../lib/queue")
const taskName = "commissionCheckPayment"
const { transaction } = require("objection")
const { Commission } = require("../models")
const commissionCancelJob = require("./commission-cancel")
const dayjs = require("dayjs")

exports.add = async (data, opts) => {
  if (opts.jobId) opts.jobId = `${taskName}-${opts.jobId}`
  return queue.add(taskName, data, opts)
}

exports.cancelJobs = async ids => {
  const jobs = await Promise.all(
    ids.map(id => queue.getJob(`${taskName}-${id}`))
  )

  await Promise.all(jobs.filter(v => v).map(job => job.remove()))
}

queue.process(taskName, async (job, data) => {
  await transaction(Commission.knex(), async trx => {
    // check whether buyer has paid
    const commission = await Commission.query(trx).findById(data.commissionId)

    if (commission.stripeCharge) {
      // push commission deadline if buyer is late
      if (data.late)
        await commission.$query(trx).patch({
          deadline: dayjs(commission.deadline)
            .add(data.late, "day")
            .format("YYYY-MM-DD")
        })
    } else {
      if (++data.late == Commission.maxPaymentLate)
        // check after 48h and the buyer still hasn't paid
        // cancel commission
        await commissionCancelJob.add(data)
      else {
        // reschedule job 24h later
        await queue.add(taskName, data, {
          delay: 24 * 60 * 60 * 1000,
          jobId: `${taskName}-${commission.id}-${data.late}`
        })
      }
    }
  })
})
