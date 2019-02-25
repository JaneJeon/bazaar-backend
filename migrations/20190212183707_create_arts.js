const tableName = require("pluralize")("art")

exports.up = knex =>
  knex.schema.createTable(tableName, table => {
    table.increments()
    table.text("title").notNullable()
    table.text("description")
    table.jsonb("pictures").notNullable()
    table
      .integer("artist_id")
      .notNullable()
      .references("users.id")
    table.integer("price")
    table.jsonb("tags")

    table.timestamps(true, true)
  })

exports.down = knex => knex.schema.dropTable(tableName)
