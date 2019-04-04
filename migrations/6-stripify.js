// add stripe_customer_id to users table for buyers, stripe_account_id for artists
// stripe_charge_id for payments table
const tableName = "users"

exports.up = knex =>
  knex.schema.table(tableName, table => {
    table.text("stripe_account_id")
    table.text("stripe_charge_id")
  })

exports.down = knex =>
  knex.schema.table(tableName, table => {
    table.dropColumns(["stripe_account_id", "stripe_charge_id"])
  })
