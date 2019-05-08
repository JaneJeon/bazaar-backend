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

    table.integer("price").notNullable()
    table.text("price_unit").notNullable()
    table.date("deadline").notNullable()
    table.integer("num_updates")
    table.text("copyright").notNullable()

    table.text("medium")
    table.text("style")
    table.text("size")

    table.jsonb("tags").notNullable()
    table.text("description").notNullable()

    table.timestamps(true, true)
    table
      .boolean("deleted")
      .notNullable()
      .defaultTo(false)
  })

exports.down = knex => knex.schema.dropTable(tableName)
