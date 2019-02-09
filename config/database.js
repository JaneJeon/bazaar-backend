const { join } = require("path")
require("dotenv").config({ path: join(__dirname, "..", ".env") })

module.exports = {
  client: "pg",
  connection: process.env.DATABASE_URL,
  debug: (process.env.DEBUG || "").includes("knex"),
  migrations: { directory: join(__dirname, "..", "migrations") },
  seeds: { directory: join(__dirname, "..", "seeds") }
}
