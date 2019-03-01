const { User, Commission } = require("../models")

exports.seed = async knex => {
  await knex("negotiations").del()

  // two different artists bid on the commission
  const [buyer, artist] = await User.query()
  const commission = await Commission.query().first()

  await commission.requestNegotiation(artist.id)
}
