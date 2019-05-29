const jwt = require("express-jwt")
const { User } = require("../models")
const { checkToken } = require("../lib/token")

exports.tryAuth = jwt({
  secret: process.env.JWT_SECRET,
  credentialsRequired: false,
  isRevoked: async (req, payload, done) => {
    try {
      req.token = payload
      done(null, !(await checkToken(payload)))
      if (await checkToken(payload)) {
        done(null, false)
      } else done(null, true)
    } catch (err) {
      done(err)
    }
  },
  getToken: function fromHeaderOrQuerystring(req) {
    if (
      req.headers.authorization &&
      req.headers.authorization.split(" ")[0] === "Bearer"
    ) {
      return req.headers.authorization.split(" ")[1]
    } else if (req.query && req.query.token) {
      return req.query.token
    }
    return null
  }
})

exports.convertUser = (req, res, next) => {
  if (req.user) req.user = User.fromJson(req.token, { skipValidation: true })
  next()
}
