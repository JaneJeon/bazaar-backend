const { MulterError } = require("multer")
const { ValidationError, NotFoundError } = require("objection")
const {
  DBError,
  UniqueViolationError,
  NotNullViolationError,
  ForeignKeyViolationError,
  CheckViolationError,
  DataError
} = require("objection-db-errors")
const debug = require("debug")("bazaar:error")
const log = require("../lib/logger")

module.exports = (err, req, res, next) => {
  // errors can happen after the response is sent when sending email
  if (res.headersSent) {
    log.error(err)
    return
  }

  if ([MulterError, ValidationError, DataError].includes(err.constructor)) {
    err.statusCode = 400
  } else if (err instanceof NotNullViolationError) {
    err.statusCode = 400
    err.data = {
      column: err.column,
      table: err.table
    }
  } else if (err instanceof CheckViolationError) {
    err.statusCode = 400
    err.data = {
      table: err.table,
      constraint: err.constraint
    }
  } else if (err instanceof NotFoundError) {
    err.statusCode = 404
  } else if (err instanceof UniqueViolationError) {
    err.statusCode = 409
    err.data = {
      columns: err.columns,
      table: err.table,
      constraint: err.constraint
    }
  } else if (err instanceof ForeignKeyViolationError) {
    err.statusCode = 409
    err.data = {
      table: err.table,
      constraint: err.constraint
    }
  } else if (err instanceof DBError) {
    err.statusCode = 500
    err.name = "UnknownDatabaseError"
  } else if (err.type && err.type.startsWith("Stripe")) {
    // https://github.com/stripe/stripe-node/blob/master/lib/Error.js#L30
    this.name = this.type
    this.data = this.detail
  } else if (!err.statusCode) {
    err.statusCode = 500
    err.name = "UnknownError"
  }

  if (
    err.statusCode == 500 ||
    process.env.NODE_ENV == "development" ||
    err.name.startsWith("AlgoliaSearch")
  )
    log.error(err)

  debug("BODY %o", req.body)
  debug("USER %o", req.user)

  res.status(err.statusCode).send({
    message: err.message,
    name: err.name,
    data: err.data || {}
  })
}
