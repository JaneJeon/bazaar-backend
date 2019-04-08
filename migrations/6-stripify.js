const tableName = "users"

exports.up = knex =>
  knex.schema.table(tableName, table => {
    table.text("stripe_account_id")
  })

exports.down = knex =>
  knex.schema.table(tableName, table => {
    table.dropColumn("stripe_account_id")
  })
