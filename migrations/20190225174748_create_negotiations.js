const tableName = "negotiations"

exports.up = knex =>
  knex.schema.createTable(tableName, table => {
    table
      .integer("commission_id")
      .references("commissions.id")
      .notNullable()
    table
      .integer("artist_id")
      .references("users.id")
      .notNullable()
    table.text("user_type").notNullable()
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

    table.primary(["commission_id", "artist_id", "user_type"])
  })

exports.down = knex => knex.schema.dropTable(tableName)
