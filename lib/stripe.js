const pick = require("lodash/pick")
const dayjs = require("dayjs")

let stripe = require("stripe")(process.env.STRIPE_PRIVATE_KEY)
if (process.env.NODE_ENV == "development") {
 stripe.setApiVersion("2019-03-14")
}

module.exports = stripe

module.exports.packTransaction = (obj, artistId, buyerId) =>
  Object.assign(
    { artistId, buyerId },
    pick(obj, ["id", "object", "amount", "currency"]),
    { created: dayjs(obj.created).format("YYYY-MM-DD HH:mm:ss") }
  )
