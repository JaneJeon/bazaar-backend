const { join } = require("path")
require("pino-debug")(require("../lib/logger"))

if (!process.env.DATABASE_URL)
  require("dotenv-defaults").config({
    path: join(__dirname, "..", ".env"),
    defaults: join(__dirname, "..", ".env.defaults")
  })
