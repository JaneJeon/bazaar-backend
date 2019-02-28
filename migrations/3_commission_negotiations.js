const tableName = "commission_negotiations"

exports.up = knex =>
  knex.schema.createTable(tableName, table => {
    table.increments()
    table
      .integer("commission_id")
      .references("commissions.id")
      .notNullable()
    table
      .text("artist_id")
      .references("users.id")
      .notNullable()

    table.unique(["commission_id", "artist_id"])
  })

exports.down = knex => knex.schema.dropTable(tableName)
