const client = require("../lib/algolia")

exports.seed = async knex => {
  await knex("chats").del()
  await knex("negotiations").del()
  await knex("commissions").del()
  await knex("favorites").del()
  await knex("arts").del()
  await knex("users").del()

  const res = await client.listIndexes()
  const indices = res.items.filter(item => item.entries).map(item => item.name)

  await Promise.all(indices.map(index => client.deleteIndex(index)))
}
