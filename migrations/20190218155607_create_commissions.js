const tableName = require("pluralize")("commission")

exports.up = knex =>
  knex.schema.createTable(tableName, table => {
    table.increments()
    table
      .integer("buyer_id")
      .references("users.id")
      .notNullable()
    table.integer("artist_id").references("users.id")

    table.float("price").notNullable()
    table.text("price_unit").notNullable()
    table.datetime("deadline").notNullable()
    table.integer("num_updates")
    table.text("copyright").notNullable()

    table.float("width")
    table.float("height")
    table.text("size_unit")
    table.jsonb("tags")
    table.text("description").notNullable()

    table.timestamps(true, true)
  })

exports.down = knex => knex.schema.dropTable(tableName)
