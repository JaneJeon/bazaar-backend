const tableName = require("pluralize")("user")

exports.up = knex =>
  knex.schema.createTable(tableName, table => {
    table.increments()
    table
      .text("email")
      .notNullable()
      .unique()
    table
      .text("username")
      .notNullable()
      .unique()
    table.text("password").notNullable()
    table
      .boolean("deleted")
      .notNullable()
      .defaultTo(false)
    table
      .boolean("verified")
      .notNullable()
      .defaultTo(false)

    table.timestamps(true, true)
  })

exports.down = knex => knex.schema.dropTable(tableName)
