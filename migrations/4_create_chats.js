const tableName = "chats"

exports.up = knex =>
  knex.schema.createTable(tableName, table => {
    table.increments()

    table.text("negotiation_id").notNullable()
    table
      .boolean("dummy_field")
      .notNullable()
      .defaultTo(true)
    table
      .foreign(["negotiation_id", "dummy_field"])
      .references(["negotiation_id", "is_artist"])
      .on("negotiations")

    table
      .text("user_id")
      .references("users.id")
      .notNullable()

    table.text("body").notNullable()

    table.timestamps(true, true)
  })

exports.down = knex => knex.schema.dropTable(tableName)
