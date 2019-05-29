const tableName = "transactions"

exports.up = knex =>
  knex.schema.createTable(tableName, table => {
    // from stripe object
    table.text("id").primary()
    table.text("object").notNullable()
    table.integer("amount").notNullable()
    table.text("currency").notNullable()
    table.timestamp("created").notNullable()

    table
      .text("buyer_id")
      .references("users.id")
      .notNullable()
    table
      .text("artist_id")
      .references("users.id")
      .notNullable()

    table.integer("art_id").references("arts.id")
    table.integer("commission_id").references("commissions.id")
    table.integer("update_num") // TODO: is there any way to refer this to update?
  })

exports.down = knex => knex.schema.dropTable(tableName)
