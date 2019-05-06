const tableName = "users"

exports.up = knex =>
  knex.schema.table(tableName, table => {
    table.text("role").notNullable()
  })

exports.down = knex =>
  knex.schema.table(tableName, table => {
    table.dropColumn("role")
  })
