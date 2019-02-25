const tableName = require("pluralize")("commission")
const { User } = require("../models")

exports.seed = async knex => {
  await knex(tableName).del()

  const [buyer, artist] = await User.query()

  // doing just one because I'm lazy
  buyer.$relatedQuery("commissions").insert({
    artist_id: artist.id,
    price: 42,
    price_unit: "USD",
    deadline: new Date().toISOString(),
    num_updates: 2,
    copyright: "buyer owns the right",
    description: "hello #test1 @test2"
  })
}
