const { Model, snakeCaseMappers } = require("objection")
const { DbErrors } = require("objection-db-errors")
const { default: visibility } = require("objection-visibility")
const { plural } = require("pluralize")
const assert = require("http-assert")

class BaseModel extends visibility(DbErrors(Model)) {
  static get tableName() {
    return plural(this.name.toLowerCase())
  }

  static get columnNameMappers() {
    return snakeCaseMappers()
  }

  static get modelPaths() {
    return [__dirname]
  }

  static get autoFields() {
    return []
  }

  // some fields shouldn't be manually set
  static async filterRequest(req) {
    this.autoFields.forEach(field => assert(req.body[field] === undefined, 400))
  }

  static get isSoftDelete() {
    return this.namedFilters && this.namedFilters.hasOwnProperty("deleted")
  }

  static async findById(id, trx) {
    let q = this.query(trx).findById(id)
    if (this.isSoftDelete) q = q.whereNotDeleted()
    return q.throwIfNotFound()
  }

  async findById(ref, id, trx) {
    let q = this.$relatedQuery(ref, trx).findById(id)
    if (this.constructor.isSoftDelete) q = q.whereNotDeleted()
    return q.throwIfNotFound()
  }

  static async paginate(after, sortField = "id", n = process.env.PAGE_SIZE) {
    let q = this.query()
      .skipUndefined()
      .where(sortField, "<", after)
    if (this.isSoftDelete) q = q.whereNotDeleted()
    return q.orderBy(sortField, "desc").limit(n)
  }

  async paginate(ref, after, sortField = "id", n = process.env.PAGE_SIZE) {
    let q = this.$relatedQuery(ref)
      .skipUndefined()
      .where(sortField, "<", after)
    if (this.constructor.isSoftDelete) q = q.whereNotDeleted()
    return q.orderBy(sortField, "desc").limit(n)
  }
}

module.exports = BaseModel
