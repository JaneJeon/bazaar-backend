const n = 3
const { User } = require("../models")
const faker = require("faker")

const users = []
for (let i = 0; i < n; i++)
  users.push({
    username: faker.random.alphaNumeric(15),
    password: faker.internet.password(10),
    email: faker.internet.email()
  })

exports.users = users

exports.seed = async knex => {
  await knex("chats").del()
  await knex("negotiations").del()
  await knex("commissions").del()
  await knex("arts").del()
  await knex("users").del()

  await User.query().insert(users)
}
