const passport = require("passport")
const { Strategy: LocalStrategy } = require("passport-local")

passport.serializeUser((user, done) => done(null, user.id))
passport.deserializeUser((id, done) => done(null, { id }))
passport.use(
  new LocalStrategy(
    { usernameField: "email" },
    async (email, password, done) => {
      // TODO
    }
  )
)
