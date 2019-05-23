const assert = require("http-assert")
const passport = require("passport")
const debug = require("debug")("bazaar:middlewares")

exports.requireSignin = passport.authenticate("local", { session: false })

exports.requireAuth = passport.authenticate("jwt", { session: false })

exports.ensureIsVerified = (req, res, next) => {
  debug(req.user)
  next(assert(req.user && req.user.verified, 401))
}

exports.ensureHasPayment = (req, res, next) =>
  next(assert(req.user && req.user.stripeCustomerId, 402))

exports.ensureIsAdmin = (req, res, next) =>
  next(assert(req.user && req.user.isAdmin, 403))
