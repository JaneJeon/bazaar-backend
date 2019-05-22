const passport = require("passport")
const { User } = require("../models")
const { NotFoundError } = require("objection")
const { Strategy: LocalStrategy } = require("passport-local")
const { Strategy: JwtStrategy, ExtractJwt } = require("passport-jwt")
const { addToken, checkToken } = require("../lib/token")

passport.use(
  new LocalStrategy(async (username, password, done) => {
    try {
      const user = await User.query().findById(username.toLowerCase())
      if (await user.verifyPassword(password)) {
        req.token = await addToken(user)
        done(null, user)
      } else done(null, false)
    } catch (err) {
      err instanceof NotFoundError ? done(null, false) : done(err)
    }
  })
)

passport.use(
  new JwtStrategy(
    {
      jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
      secretOrKey: process.env.JWT_SECRET,
      passReqToCallback: true
    },
    async (req, payload, done) => {
      req.token = payload

      // check blacklist
      try {
        if (await checkToken(payload)) {
          // strip payload off token-only information
          delete payload.exp
          delete payload.iat
          delete payload.jwtid
          done(null, User.fromJson(payload, { skipValidation: true }))
        } else done(null, false)
      } catch (err) {
        done(err)
      }
    }
  )
)
