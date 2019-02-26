const { ValidationError, NotFoundError } = require("objection")
const {
  DBError,
  UniqueViolationError,
  NotNullViolationError,
  ForeignKeyViolationError,
  CheckViolationError,
  DataError
} = require("objection-db-errors")

module.exports = (err, res) => {
  // errors can happen after the response is sent when sending email
  if (res.headersSent) {
    console.error(err)
    return
  }

  if (err instanceof ValidationError) {
    err.statusCode = 400
    switch (err.type) {
      case "ModelValidation":
        err.type = "ModelValidation"
        break
      case "RelationExpression":
        err.type = "InvalidRelationExpression"
        break
      case "UnallowedRelation":
        err.type = "UnallowedRelation"
        break
      case "InvalidGraph":
        err.type = "InvalidGraph"
        break
      default:
        err.type = "UnknownValidationError"
    }
  } else if (err instanceof NotFoundError) {
    err.statusCode = 404
    err.type = "NotFound"
  } else if (err instanceof UniqueViolationError) {
    err.statusCode = 409
    err.type = "UniqueViolation"
    err.data = {
      columns: err.columns,
      table: err.table,
      constraint: err.constraint
    }
  } else if (err instanceof NotNullViolationError) {
    err.statusCode = 400
    err.type = "NotNullViolation"
    err.data = {
      column: err.column,
      table: err.table
    }
  } else if (err instanceof ForeignKeyViolationError) {
    err.statusCode = 409
    err.message = "ForeignKeyViolation"
    err.data = {
      table: err.table,
      constraint: err.constraint
    }
  } else if (err instanceof CheckViolationError) {
    err.statusCode = 400
    err.message = "CheckViolation"
    err.data = {
      table: err.table,
      constraint: err.constraint
    }
  } else if (err instanceof DataError) {
    err.statusCode = 400
    err.type = "InvalidData"
  } else if (err instanceof DBError) {
    err.statusCode = 500
    err.type = "UnknownDatabaseError"
  } else {
    if (!err.statusCode) err.statusCode = 500
    err.type = "UnknownError"
  }

  if (err.statusCode == 500) console.error(err)

  res.status(err.statusCode).send({
    message: err.message,
    type: err.type,
    data: err.data || {}
  })
}
