const tableName = "negotiations"

exports.up = knex =>
  knex.schema.createTable(tableName, table => {
    table
      .integer("commission_id")
      .references("commissions.id")
      .notNullable()
    table
      .text("artist_id")
      .references("users.id")
      .notNullable()
    table.boolean("is_artist").notNullable()
    table.primary(["commission_id", "artist_id", "is_artist"])

    table.boolean("accepted").notNullable()
    table.boolean("finalized").notNullable()

    table.integer("price").notNullable()
    table.text("price_unit").notNullable()
    table.date("deadline").notNullable()
    table.integer("num_updates")
    table.text("copyright").notNullable()

    table.timestamps(true, true)
  })

exports.down = knex => knex.schema.dropTable(tableName)
