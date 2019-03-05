const { join } = require("path")
if (!process.env.NODE_ENV)
  require("dotenv-defaults").config({
    path: join(__dirname, "..", ".env"),
    defaults: join(__dirname, "..", ".env.defaults")
  })

module.exports = {
  client: "pg",
  connection: process.env.DATABASE_URL,
  debug: (process.env.DEBUG || "").includes("knex"),
  migrations: { directory: join(__dirname, "..", "migrations") },
  seeds: { directory: join(__dirname, "..", "seeds") },
  pool: {
    afterCreate: (conn, done) => {
      conn.query('SET timezone="UTC"', err => done(err, conn))
    }
  }
}
