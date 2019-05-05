const n = 3
const { User } = require("../models")
const faker = require("faker")
const pick = require("lodash/pick")

faker.seed(42)

const users = []
for (let i = 0; i < n; i++)
  users.push({
    username: faker.random.alphaNumeric(15),
    password: "123456789",
    email: faker.internet.email()
  })

exports.users = users.map(user => pick(user, ["username", "password"]))

exports.seed = async knex => {
  await User.query().insert(users)

  // make the users verified since they're here more for testing
  await knex("users").update({ verified: true })
}
