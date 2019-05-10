const tableName = "reports"

exports.up = knex =>
  knex.schema.createTable(tableName, table => {
    table
      .text("transaction_id")
      .references("transactions.id")
      .notNullable()
    table
      .text("reporter_id")
      .references("users.id")
      .notNullable()
    table.primary(["transaction_id", "reporter_id"])

    table.text("details").notNullable()

    table.timestamps(true, true)
  })

exports.down = knex => knex.schema.dropTable(tableName)
