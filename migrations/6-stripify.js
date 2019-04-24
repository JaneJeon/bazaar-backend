const tableName = "users"

exports.up = knex =>
  knex.schema.table(tableName, table => {
    table.text("stripe_account_id")
    table.text("stripe_customer_id")
    table
      .boolean("has_stripe_account")
      .notNullable()
      .defaultTo(false)
    table
      .boolean("is_stripe_customer")
      .notNullable()
      .defaultTo(false)
  })

exports.down = knex =>
  knex.schema.table(tableName, table => {
    table.dropColumns([
      "stripe_account_id",
      "stripe_customer_id",
      "has_stripe_account",
      "is_stripe_customer"
    ])
  })
