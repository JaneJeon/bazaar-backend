const tableName = "users"

exports.up = knex =>
  knex.schema.createTable(tableName, table => {
    table.increments()
    table
      .text("email")
      .notNullable()
      .unique()
    table
      .text("username")
      .notNullable()
      .unique()
    table.text("password").notNullable()
    table
      .boolean("verified")
      .notNullable()
      .defaultTo(false)

    table.text("avatar")
    table.text("name")
    table.text("location")
    table.text("bio")

    table.timestamps(true, true)
    table
      .boolean("deleted")
      .notNullable()
      .defaultTo(false)
  })

exports.down = knex => knex.schema.dropTable(tableName)
