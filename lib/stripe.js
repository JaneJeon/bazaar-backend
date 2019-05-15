const pick = require("lodash/pick")
const dayjs = require("dayjs")

module.exports = require("stripe")(process.env.STRIPE_PRIVATE_KEY)

module.exports.packTransaction = (obj, artistId, buyerId) =>
  Object.assign(
    { artistId, buyerId },
    pick(obj, ["id", "object", "amount", "currency"]),
    dayjs(obj.created).format("YYYY-MM-DD HH:mm:ss")
  )
