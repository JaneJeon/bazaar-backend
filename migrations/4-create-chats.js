const tableName = "chats"

exports.up = knex =>
  knex.schema.createTable(tableName, table => {
    table.increments()

    table.integer("commission_id").notNullable()
    table.text("artist_id").notNullable()
    table
      .boolean("dummy_field")
      .notNullable()
      .defaultTo(true)
    table
      .foreign(["commission_id", "artist_id", "dummy_field"])
      .references(["commission_id", "artist_id", "is_artist"])
      .on("negotiations")
      .onDelete("cascade")

    table
      .text("user_id")
      .references("users.id")
      .notNullable()

    table.text("message").notNullable()

    table.timestamps(true, true)
  })

exports.down = knex => knex.schema.dropTable(tableName)
