const tableName = "reviews"

exports.up = knex =>
  knex.schema.createTable(tableName, table => {
    table.text("description")
    table.integer("rating").notNullable()
    table
      .text("review_id")
      .notNullable()
      .references("users.id")
    table
      .text("reviewed_id")
      .notNullable()
      .references("users.id")

    table.primary(["id", "review_id", "reviewed_id"])
  })

exports.down = knex => knex.schema.dropTable(tableName)
