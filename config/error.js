const log = require("../lib/log")
const pick = require("lodash/pick")
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
const { HttpError } = require("http-errors")

const logError = err => {
  err.stack = err.stack.slice(0, err.stack.lastIndexOf("at newFn")).trimRight()
  log.error(pick(err, ["message", "name", "data", "stack"]))
}

module.exports = (err, res) => {
  // errors can happen after the response is sent when sending email
  if (res.headersSent) {
    logError(err)
    return
  }

  if (
    err instanceof MulterError ||
    err instanceof ValidationError ||
    err instanceof DataError
  ) {
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
  } else if (!(err.name == "AssertionError")) {
    err.statusCode = 500
    err.name = "UnknownError"
  }

  if (err.statusCode == 500) logError(err)

  res.status(err.statusCode).send({
    message: err.message,
    name: err.name,
    data: err.data || {}
  })
}
