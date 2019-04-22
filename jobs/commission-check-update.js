const queue = require("../lib/queue")
const taskName = "commissionCheckUpdate"
const { transaction } = require("objection")
const { Update } = require("../models")
const commissionPayoutJob = require("./commission-payout")
const commissionCancelJob = require("./commission-cancel")
const dayjs = require("dayjs")

exports.add = async (data, opts) => {
  if (opts.jobId) opts.jobId = `${taskName}-${opts.jobId}`
  return queue.add(taskName, data, opts)
}

exports.trigger = async jobId => {
  const job = await queue.getJob(`${taskName}-${jobId}`)

  if (job !== null) await job.promote()
}

queue.process(taskName, async (job, data) => {
  await transaction(Update.knex(), async trx => {
    const update = await Update.query(trx).findById([
      data.commissionId,
      data.updateNum
    ])

    if (update.pictures || update.waived) {
      // proceed to payment, scheduled for the deadline
      await commissionPayoutJob.add(data, {
        delay: dayjs().diff(dayjs(update.deadline))
      })
    } else {
      // check if 48h grace period has passed
      if (data.late == 2) {
        // proceed to cancellation
        await commissionCancelJob.add(data)
      } else {
        // reschedule self
        data.late++
        await queue.add(taskName, data, { delay: 24 * 60 * 60 * 1000 })
      }
    }
  })
})
