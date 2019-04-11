const tableName = "users"

exports.up = knex =>
  knex.schema.table(tableName, table => {
    table.text("stripe_account_id")
    table.text("stripe_customer_id")
  })

exports.down = knex =>
  knex.schema.table(tableName, table => {
    table.dropColumns(["stripe_account_id", "stripe_customer_id"])
  })
