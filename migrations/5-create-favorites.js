const tableName = "favorites"

exports.up = knex =>
  knex.schema.createTable(tableName, table => {
    table
      .text("user_id")
      .notNullable()
      .references("users.id")
    table
      .integer("art_id")
      .notNullable()
      .references("arts.id")

    table.primary(['user_id', 'art_id'])
  })

exports.down = knex => knex.schema.dropTable(tableName)
