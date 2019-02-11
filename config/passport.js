const passport = require("passport")
const { User } = require("../models")
const { Strategy: LocalStrategy } = require("passport-local")

passport.serializeUser((user, done) => done(null, user.id))
passport.deserializeUser(async (id, done) => {
  try {
    const user = await User.query()
      .findById(id)
      .whereNotDeleted()
    if (!user) done(null, false)
    else done(null, user)
  } catch (err) {
    done(err)
  }
})

passport.use(
  new LocalStrategy(
    { usernameField: "email" },
    async (email, password, done) => {
      const user = await User.query().findOne({ email })
      return user && (await user.verifyPassword(password))
        ? done(null, user)
        : done(null, false)
    }
  )
)
