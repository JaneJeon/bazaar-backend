require("express-async-errors")
require("./config/passport")

const express = require("express")
const app = express()
require("express-ws")(app)

const helmet = require("helmet")
const cors = require("cors")
const cookieSession = require("cookie-session")
const passport = require("passport")
const rateLimiter = require("./config/ratelimit")
const router = require("./routes")
const errorHandler = require("./config/error")

if (process.env.NODE_ENV == "production") app.enable("trust proxy")
app
  .use(helmet())
  .use(cors({ origin: process.env.FRONTEND_URL, credentials: true }))
  .use(express.json())
  .use(
    cookieSession({
      keys: [process.env.SESSION_SECRET],
      sameSite: "lax",
      secure: process.env.NODE_ENV == "production"
    })
  )
  .use(passport.initialize())
  .use(passport.session())
  .use(rateLimiter)
  .use(router)
  .use((req, res) => res.sendStatus(404))
  .use((err, req, res, next) => errorHandler(err, res))

app.listen(process.env.PORT, err => {
  if (err) console.error(err)
})

module.exports = app
