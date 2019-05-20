const tableName = "users"

exports.up = knex =>
  knex.schema.createTable(tableName, table => {
    table.text("id").primary()
    table.text("username").notNullable()
    table
      .text("email")
      .notNullable()
      .unique()
    table.text("password").notNullable()
    table.boolean("verified").notNullable()

    table.text("avatar")
    table.text("name")
    table.text("location")
    table.text("bio")

    table.timestamps(true, true)
    table
      .boolean("deleted")
      .notNullable()
      .defaultTo(false)
    table
      .boolean("banned")
      .notNullable()
      .defaultTo(false)
  })

exports.down = knex => knex.schema.dropTable(tableName)
