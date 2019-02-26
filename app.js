require("express-async-errors")
require("./config/passport")

const express = require("express")
const helmet = require("helmet")
const cors = require("cors")
const cookieSession = require("cookie-session")
const passport = require("passport")
const rateLimit = require("express-rate-limit")
const RedisStore = require("rate-limit-redis")
const redis = require("./config/redis")
const router = require("./routes")
const errorHandler = require("./config/error")

const app = express()
if (process.env.NODE_ENV == "production") app.enable("trust proxy")
app
  .use(helmet())
  .use(cors({ origin: process.env.FRONTEND_URL }))
  .use(express.json())
  .use(cookieSession({ secret: process.env.SESSION_SECRET, sameSite: "lax" }))
  .use(passport.initialize())
  .use(passport.session())
  .use(rateLimit({ store: new RedisStore({ client: redis }) }))
  .use(router)
  .use((req, res) => res.sendStatus(404))
  .use((err, req, res, next) => errorHandler(err, res))

app.listen(process.env.PORT, err => {
  if (err) console.error(err)
})
