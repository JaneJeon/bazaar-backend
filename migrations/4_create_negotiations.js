const tableName = "negotiations"

exports.up = knex =>
  knex.schema.createTable(tableName, table => {
    table
      .integer("commission_negotiation_id")
      .references("commission_negotiations.id")
      .notNullable()
    table.boolean("is_artist").notNullable()
    table.boolean("accepted").notNullable()
    table.boolean("finalized").notNullable()

    table.integer("price").notNullable()
    table.text("price_unit").notNullable()
    table.date("deadline").notNullable()
    table.integer("num_updates")
    table.text("copyright").notNullable()

    table.float("width")
    table.float("height")
    table.text("size_unit")

    table.timestamps(true, true)

    table.primary(["commission_negotiation_id", "is_artist"])
  })

exports.down = knex => knex.schema.dropTable(tableName)
