const { join } = require("path")
if (!process.env.NODE_ENV)
  require("dotenv-defaults").config({
    path: join(__dirname, "..", ".env"),
    defaults: join(__dirname, "..", ".env.defaults")
  })
