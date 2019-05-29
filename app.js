require("./config/preload")
require("./config/passport")
require("express-async-errors")

const express = require("express")
const app = express()
require("express-ws")(app)

app
  .set("trust proxy", process.env.NODE_ENV == "production")
  .use(require("helmet")())
  .use(require("cors")())
  .use(require("./config/jwt"))
  .use(require("./config/ratelimit"))
  .use(express.json())
  .use(require("passport").initialize())
  .use(require("./routes"))
  .use((req, res) => res.sendStatus(404))
  .use(require("./config/error"))

app.listen(process.env.PORT || 4000, err => {
  if (err) console.error(err)
  require("debug")("bazaar:startup")("server started")
})

module.exports = app
