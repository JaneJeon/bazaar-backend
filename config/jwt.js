const jwt = require("express-jwt")
const { User } = require("../models")
const { checkToken } = require("../lib/token")

module.exports = jwt({
  secret: process.env.JWT_SECRET,
  credentialsRequired: false,
  isRevoked: async (req, payload, done) => {
    try {
      req.token = payload
      if (await checkToken(payload)) {
        req.user = User.fromJson(payload, { skipValidation: true })
        done(null, true)
      } else done(null, false)
    } catch (err) {
      done(err)
    }
  }
})
