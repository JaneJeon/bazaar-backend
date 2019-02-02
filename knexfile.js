require("dotenv").config()

module.exports = {
  client: "pg",
  connection: process.env.DATABASE_URL,
  debug: (process.env.DEBUG || "").includes("knex")
}
