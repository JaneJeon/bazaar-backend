const tableName = "updates"

exports.up = knex =>
  knex.schema.createTable(tableName, table => {
    table.increments()
    table
      .integer("commission_id")
      .references("commissions.id")
      .notNullable()

    table.integer("price").notNullable()
    table.text("price_unit").notNullable()

    table.integer("delays").notNullable()
    table.boolean("waived").notNullable()
    table.date("deadline").notNullable()
    table.text("picture")

    table.integer("payment_id").references("payments.id")
  })

exports.down = knex => knex.schema.dropTable(tableName)
