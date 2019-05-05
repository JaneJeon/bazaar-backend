const queue = require("../lib/queue")
const taskName = "commissionCheckUpdate"
const { transaction } = require("objection")
const { Update } = require("../models")
const commissionPayoutJob = require("./commission-payout")
const commissionCancelJob = require("./commission-cancel")
const dayjs = require("dayjs")
const debug = require("debug")("bazaar:jobs:commissionCheckUpdate")

exports.add = async (data, opts) => {
  if (opts.jobId) opts.jobId = `${taskName}-${opts.jobId}`
  debug("adding job " + opts.jobId || null)

  return queue.add(taskName, data, opts)
}

exports.trigger = async jobId => {
  const id = `${taskName}-${jobId}`
  debug("immediately triggering job " + id)

  const job = await queue.getJob(id)

  if (job !== null) await job.promote()
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
    debug("job data:")
    debug(job.data)

    const update = await Update.query(trx).findById([
      data.commissionId,
      data.updateNum
    ])

    if (update.pictures || update.waived) {
      debug("payout now")

      // immediately pay out if late
      const now = dayjs()
      const deadline = dayjs(update.deadline)
      let delay = 0

      if (!now.isAfter(deadline)) delay = now.diff(deadline)

      debug("delay:")
      debug(delay)

      // proceed to payment, scheduled for the deadline
      await commissionPayoutJob.add(data, { delay, jobId: update.jobId })
    } else {
      debug("late: " + data.late)

      // check if 48h grace period has passed
      if (data.late == 2) {
        // proceed to cancellation
        await commissionCancelJob.add(data)
      } else {
        // reschedule self
        await update.$query(trx).patch({ delays: ++data.late })
        await queue.add(taskName, data, { delay: 24 * 60 * 60 * 1000 })
      }
    }
  })
})
