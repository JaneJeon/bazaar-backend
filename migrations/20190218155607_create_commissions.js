const tableName = "commissions"

exports.up = knex =>
  knex.schema.createTable(tableName, table => {
    table.increments()
    table
      .text("buyer_id")
      .references("users.id")
      .notNullable()
    table.text("artist_id").references("users.id")
    table.boolean("is_private").notNullable()
    table.text("status").notNullable()
    table.text("cancelled_by")

    table.integer("price").notNullable()
    table.text("price_unit").notNullable()
    table.date("deadline").notNullable()
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
