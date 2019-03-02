const passport = require("passport")
const { User } = require("../models")
const { Strategy: LocalStrategy } = require("passport-local")
const text = require("../lib/text")

passport.serializeUser((user, done) => done(null, user.id))
passport.deserializeUser(async (id, done) => {
  try {
    const user = await User.findById(id)
    if (!user) done(null, false)
    else done(null, user)
  } catch (err) {
    done(err)
  }
})

passport.use(
  new LocalStrategy(async (username, password, done) => {
    const user = await User.findById(text.slugify(username))
    return user && (await user.verifyPassword(password))
      ? done(null, user)
      : done(null, false)
  })
)
