const passport = require("passport")
const { User } = require("../models")
const { NotFoundError } = require("objection")
const { Strategy: LocalStrategy } = require("passport-local")

passport.use(
  new LocalStrategy(async (username, password, done) => {
    try {
      const user = await User.query().findById(username.toLowerCase())
      ;(await user.verifyPassword(password))
        ? done(null, user)
        : done(null, false)
    } catch (err) {
      err instanceof NotFoundError ? done(null, false) : done(err)
    }
  })
)
