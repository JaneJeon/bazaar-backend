const assert = require("http-assert")
const adminRoles = ["admin", "superuser"]

exports.ensureSignedIn = (req, res, next) => next(assert(req.user, 401))

exports.ensureVerified = (req, res, next) =>
  next(assert(req.user && req.user.verified, 401))

exports.ensureHasPayment = (req, res, next) =>
  next(assert(req.user && req.user.stripeCustomerId, 402))

const isAdmin = user => adminRoles.includes(user.role)
exports.isAdmin = isAdmin

exports.ensureAdmin = (req, res, next) =>
  next(assert(req.user && isAdmin(req.user), 403))
