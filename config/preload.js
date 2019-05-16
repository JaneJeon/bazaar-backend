const { join } = require("path")

if (!process.env.DATABASE_URL)
  require("dotenv-defaults").config({
    path: join(__dirname, "..", ".env"),
    defaults: join(__dirname, "..", ".env.defaults")
  })
