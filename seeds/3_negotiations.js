const { User, Commission } = require("../models")

exports.seed = async knex => {
  await knex("negotiations").del()

  // two different artists bid on the commission
  const [_, artist1, artist2] = await User.query()
  const commission = await Commission.query().findOne()
}
