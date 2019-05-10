const tableName = "reviews"

exports.up = knex =>
  knex.schema.createTable(tableName, table => {
    table.increments()

    table
      .text("reviewer_id")
      .notNullable()
      .references("users.id")
    table
      .text("reviewee_id")
      .notNullable()
      .references("users.id")

    table.integer("rating").notNullable()
    table.text("description")

    table.integer("art_id").references("arts.id")
    table.integer("commission_id").references("commissions.id")

    table.timestamps(true, true)
  })

exports.down = knex => knex.schema.dropTable(tableName)
