const tableName = "updates"

exports.up = knex =>
  knex.schema.createTable(tableName, table => {
    table
      .integer("commission_id")
      .references("commissions.id")
      .notNullable()
    table.integer("update_num").notNullable()
    table.primary(["commission_id", "update_num"])

    table.float("price").notNullable()
    table.text("price_unit").notNullable()

    table.integer("delays").notNullable()
    table.boolean("waived").notNullable()
    table.date("deadline").notNullable()
    table.jsonb("pictures")

    table.text("stripe_transfer_id")
    table.text("stripe_refund_id")
  })

exports.down = knex => knex.schema.dropTable(tableName)