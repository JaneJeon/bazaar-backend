const { User, Negotiation } = require("../models")
const faker = require("faker")

exports.seed = async knex => {
  await knex("chats").del()

  const users = await User.query()
  const negotiation = await Negotiation.query().first()

  await negotiation
    .$relatedQuery("chats")
    .insert([
      { userId: users[0].id, body: faker.random.words(5) },
      { userId: users[1].id, body: faker.random.words(5) }
    ])
}
