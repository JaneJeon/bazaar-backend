const pick = require("lodash/pick")

module.exports = require("stripe")(process.env.STRIPE_PRIVATE_KEY)

module.exports.packTransaction = (obj, artistId, buyerId) =>
  Object.assign(
    { artistId, buyerId },
    pick(obj, ["id", "object", "amount", "currency", "created"])
  )
