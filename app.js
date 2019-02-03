require("dotenv").config()
require("express-async-errors")
require("./config/passport")

const express = require("express")
const helmet = require("helmet")
const cors = require("cors")
const { json: jsonParser } = require("body-parser")
const cookieSession = require("cookie-session")
const passport = require("passport")
const rateLimit = require("express-rate-limit")
const RedisStore = require("rate-limit-redis")
const redis = require("./config/redis")
const router = require("./routes")

const app = express()
if (process.env.NODE_ENV == "production") app.enable("trust proxy")
app
  .use(helmet())
  .use(cors())
  .use(jsonParser())
  .use(cookieSession({ secret: process.env.SESSION_SECRET, sameSite: "lax" }))
  .use(passport.initialize())
  .use(passport.session())
  .use(rateLimit({ store: new RedisStore({ client: redis }) }))
  .use(router)
  .use((req, res) => res.sendStatus(404))
  .use((err, req, res, next) => {
    res
      .status(
        err.statusCode >= 400 && err.statusCode < 600 ? err.statusCode : 500
      )
      .send({ error: err.message })
  })

app.listen(process.env.PORT, err => {
  if (err) console.error(err)
})
