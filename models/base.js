const { Model } = require("objection")
const { DbErrors } = require("objection-db-errors")
const { default: visibility } = require("objection-visibility")
const { plural } = require("pluralize")

class BaseModel extends visibility(DbErrors(Model)) {
  static get tableName() {
    return plural(this.name.toLowerCase())
  }

  static get modelPaths() {
    return [__dirname]
  }

  static async queryById(id) {
    let q = this.constructor.query().findById(id)
    // soft delete
    if (this.prototype.namedFilters.hasOwnProperty("deleted"))
      q = q.whereNotDeleted()

    return q.throwIfNotFound()
  }

  // paginate by id
  static async paginate(after) {
    return this.constructor
      .query()
      .skipUndefined()
      .where("id", "<", after)
      .orderBy("id", "desc")
      .limit(process.env.PAGE_SIZE)
  }
}

module.exports = BaseModel
