const queue = require("../lib/queue")
const taskName = "commissionCheckPayment"
const { transaction } = require("objection")
const { Commission } = require("../models")
const commissionCancelJob = require("./commission-cancel")
const dayjs = require("dayjs")

exports.add = async (data, opts) => queue.add(taskName, data, opts)

queue.process(taskName, async (job, data) => {
  await transaction(Commission.knex(), async trx => {
    // check whether buyer has paid
    const commission = await Commission.query(trx).findById(data.commissionId)
    const payments = await commission.$relatedQuery("payments", trx).count()

    if (payments) {
      // push commission deadline if buyer is late
      if (data.late)
        await commission.$query(trx).patch({
          deadline: dayjs(commission.deadline)
            .add(1, "day")
            .format("YYYY-MM-DD")
        })
    } else {
      if (data.late)
        // cancel commission
        await commissionCancelJob.add(data)
      else {
        // reschedule job 24h later
        data.late++
        await queue.add(taskName, data, { delay: 24 * 60 * 60 * 1000 })
      }
    }
  })
})
