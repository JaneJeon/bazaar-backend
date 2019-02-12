const tableName = require("pluralize")("art")

exports.up = knex =>
  knex.schema.createTable(tableName, table => {
    table.increments()
    table.text("title").notNullable()
    table.text("description")
    table.specificType("pictures", "TEXT[]").notNullable()
    table
      .integer("artist")
      .notNullable()
      .references("users.id")
    table.integer("price")
    table.specificType("tags", "TEXT[]")
    table.text("medium")

    table.timestamps(true, true)
  })

exports.down = knex => knex.schema.dropTable(tableName)
