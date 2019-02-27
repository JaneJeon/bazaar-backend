const { User } = require("../models")

exports.seed = async knex => {
  await knex("commissions").del()

  const [buyer, artist] = await User.query()

  // doing just one because I'm lazy
  await buyer.$relatedQuery("commissionsAsBuyer").insert({
    artist_id: artist.id,
    price: 42,
    price_unit: "USD",
    deadline: "2019-03-05",
    num_updates: 2,
    copyright: "buyer owns the right",
    description: "hello #test1 @test2"
  })
}
