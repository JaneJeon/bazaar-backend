const tableName = "negotiations"

exports.up = knex =>
  knex.schema.createTable(tableName, table => {
    table.increments()
    table
      .text("negotiation_id")
      .references("negotiations.negotiation_id")
      .notNullable()
    table
      .integer("user_id")
      .references("users.id")
      .notNullable()

    table.text("body").notNullable()

    table.timestamps(true, true)
  })

exports.down = knex => knex.schema.dropTable(tableName)
