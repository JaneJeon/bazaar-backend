const tableName = "arts"

exports.up = knex =>
  knex.schema.createTable(tableName, table => {
    table.increments()
    table.text("title").notNullable()
    table.text("description")
    table.jsonb("pictures").notNullable()
    table
      .text("artist_id")
      .notNullable()
      .references("users.id")
    table.integer("price")
    table.text("price_unit").notNullable()
    table.jsonb("tags")

    table.timestamps(true, true)
  })

exports.down = knex => knex.schema.dropTable(tableName)
