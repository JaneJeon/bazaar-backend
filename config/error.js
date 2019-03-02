const log = require("../lib/log")
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

const logError = err => {
  err.stack = err.stack.slice(0, err.stack.lastIndexOf("at newFn")).trimRight()
  log.error(err)
}

module.exports = (err, res) => {
  // errors can happen after the response is sent when sending email
  if (res.headersSent) {
    logError(err)
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
  } else if (!err.statusCode) {
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
