const { User, Commission } = require("../models")

exports.seed = async () => {
  // two different artists bid on the commission
  const [buyer, artist] = await User.query()
  const commission = await Commission.query().first()

  await commission.beginNegotiation(true, artist.id)
}
