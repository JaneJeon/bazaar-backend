const tableName = "reviews"

exports.up = knex =>
  knex.schema.createTable(tableName, table => {
    table.text("description")
    table.integer("rating").notNullable()
    table
      .text("relatedCommission_id")
      .notNullable()
      .references("commissions.id")
    table
      .text("buyer_id")
      .notNullable()
      .references("users.id")
    table
      .integer("artist_id")
      .notNullable()
      .references("users.id")

    table.primary(["buyer_id", "artist_id"])
  })

exports.down = knex => knex.schema.dropTable(tableName)
