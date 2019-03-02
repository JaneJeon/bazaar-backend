const n = 3
const { User } = require("../models")
const faker = require("faker")

exports.seed = async knex => {
  await knex("chats").del()
  await knex("negotiations").del()
  await knex("commissions").del()
  await knex("arts").del()
  await knex("users").del()

  const promises = []
  for (let i = 0; i < n; i++) {
    promises.push(
      User.query().insert({
        username: faker.random.alphaNumeric(15),
        password: faker.internet.password(9),
        email: faker.internet.email()
      })
    )
  }

  await Promise.all(promises)
}
