const { Model } = require("objection")
const { DbErrors } = require("objection-db-errors")
const { default: visibility } = require("objection-visibility")
const { plural } = require("pluralize")

class BaseModel extends visibility(DbErrors(Model)) {
  static get tableName() {
    return plural(this.name.toLowerCase())
  }
}

module.exports = BaseModel
