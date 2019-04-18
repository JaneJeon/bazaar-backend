const tableName = "payments"

exports.up = knex =>
  knex.schema.createTable(tableName, table => {
    table.increments()

    table
      .text("buyer_id")
      .notNullable()
      .references("users.id")
    table
      .text("artist_id")
      .notNullable()
      .references("users.id")

    table.integer("art_id").references("arts.id")
    table.integer("commission_id").references("commissions.id")

    table.text("stripe_charge_id").notNullable()
    table.integer("price").notNullable()
    table.text("price_unit").notNullable()

    table.timestamps()
  })

exports.down = knex => knex.schema.dropTable(tableName)
