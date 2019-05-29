const jwt = require("express-jwt")
const { User } = require("../models")
const { checkToken } = require("../lib/token")

exports.tryAuth = jwt({
  secret: process.env.JWT_SECRET,
  credentialsRequired: false,
  isRevoked: async (req, payload, done) => {
    try {
      done(null, await checkToken(payload))
    } catch (err) {
      done(err)
    }
  }
})

exports.parseUser = (req, res, next) => {
  req.token = req.user
  if (req.token) req.user = User.fromJson(req.token, { skipValidation: true })
  next()
}
