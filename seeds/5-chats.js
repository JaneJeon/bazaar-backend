const { User, Negotiation } = require("../models")
const faker = require("faker")

exports.seed = async () => {
  const users = await User.query()
  const negotiation = await Negotiation.query().first()

  await negotiation
    .$relatedQuery("chats")
    .insert([
      { userId: users[0].id, message: faker.random.words(5) },
      { userId: users[1].id, message: faker.random.words(5) }
    ])
}
