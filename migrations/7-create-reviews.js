const tableName = "reviews"

exports.up = knex =>
  knex.schema.createTable(tableName, table => {
    table.text("description")
    table.integer("rating").notNullable()
    table
      .integer("relatedCommission_id")
      .notNullable()
      .references("commissions.id")
    table
      .text("buyer_id")
      .notNullable()
      .references("users.id")
    table
      .text("artist_id")
      .notNullable()
      .references("users.id")

    table.primary(["relatedCommission_id", "buyer_id", "artist_id"])
  })

exports.down = knex => knex.schema.dropTable(tableName)
