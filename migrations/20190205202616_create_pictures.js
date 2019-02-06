const tableName = require("pluralize")("picture")

exports.up = knex =>
  knex.schema.createTable(tableName, table => {
    table.increments()
    table.text("title").notNullable()
    table.text("description")
    table.text("url").notNullable()
    // no user foreign key... for now

    table.timestamps(true, true)
  })

exports.down = knex => knex.schema.dropTable(tableName)
