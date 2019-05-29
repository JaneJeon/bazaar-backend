const assert = require("http-assert")
const passport = require("passport")

exports.requireSignin = passport.authenticate("local", { session: false })

exports.requireAuth = (req, res, next) => next(assert(req.user, 401))

exports.ensureIsVerified = (req, res, next) => {
  assert(req.user, 401)
  next(assert(req.user.verified, 403))
}

exports.ensureHasPayment = (req, res, next) => {
  assert(req.user, 401)
  next(assert(req.user.stripeCustomerId, 402))
}

exports.ensureIsAdmin = (req, res, next) => {
  assert(req.user, 401)
  next(assert(req.user.isAdmin, 403))
}
