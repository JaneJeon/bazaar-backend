const { join } = require("path")

module.exports = {
  client: "pg",
  connection: {
    url: process.env.DATABASE_URL,
    timezone: "UTC"
  },
  debug: (process.env.DEBUG || "").includes("knex"),
  migrations: { directory: join(__dirname, "..", "migrations") },
  seeds: { directory: join(__dirname, "..", "seeds") }
}
