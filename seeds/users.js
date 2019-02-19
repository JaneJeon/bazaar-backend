require("../")

const tableName = require("pluralize")("user")
const { User } = require("../models")
const n = 3
const faker = require("faker")

exports.seed = async knex => {
  await knex(tableName).del()

  const promises = []
  for (let i = 0; i < n; i++) {
    promises.push(
      User.query().insert({
        username: faker.internet.userName(),
        password: faker.internet.password(9),
        email: faker.internet.email()
      })
    )
  }

  await Promise.all(promises)
}
