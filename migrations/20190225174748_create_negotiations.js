const tableName = require("pluralize")("negotiation")

exports.up = knex =>
  knex.schema.createTable(tableName, table => {
    table.increments()
    table
      .integer("commission_id")
      .references("commissions.id")
      .notNullable()
    table
      .integer("buyer_id")
      .references("users.id")
      .notNullable()
    table
      .integer("artist_id")
      .references("users.id")
      .notNullable()
    table.boolean("accepted").notNullable()

    table.float("price").notNullable()
    table.text("price_unit").notNullable()
    table.datetime("deadline").notNullable()
    table.integer("num_updates")
    table.text("copyright").notNullable()

    table.float("width")
    table.float("height")
    table.text("size_unit")

    table.timestamps(true, true)
  })

exports.down = knex => knex.schema.dropTable(tableName)
