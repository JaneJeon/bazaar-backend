const { Model, snakeCaseMappers } = require("objection")
const { DbErrors } = require("objection-db-errors")
const { default: visibility } = require("objection-visibility")
const memoize = require("lodash/memoize")
const { plural } = require("pluralize")
const { snakeCase } = require("objection/lib/utils/identifierMapping")
const assert = require("http-assert")

const snake_plural_memoized = memoize(str => plural(snakeCase(str)))

class BaseModel extends visibility(DbErrors(Model)) {
  static get tableName() {
    return snake_plural_memoized(this.name)
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
  static async filterRequest(body) {
    this.autoFields.forEach(field => assert(body[field] === undefined, 400))
  }

  static get isSoftDelete() {
    return this.namedFilters && this.namedFilters.hasOwnProperty("deleted")
  }

  static async findById(id, trx) {
    let q = this.query(trx).findById(id)
    if (this.isSoftDelete) q = q.whereNotDeleted()
    return q.throwIfNotFound()
  }

  // not bothering with the whole soft-delete bullshit since it only
  // applies to the current class, not the referenced one
  async findById(ref, id, trx) {
    return this.$relatedQuery(ref, trx)
      .findById(id)
      .throwIfNotFound()
  }

  static async paginate(after, sortField = "id") {
    let q = this.query()
      .skipUndefined()
      .where(sortField, "<", after)
    if (this.isSoftDelete) q = q.whereNotDeleted()
    return q.orderBy(sortField, "desc").limit(process.env.PAGE_SIZE)
  }

  async paginate(ref, after, sortField = "id") {
    return this.$relatedQuery(ref)
      .skipUndefined()
      .where(sortField, "<", after)
      .orderBy(sortField, "desc")
      .limit(process.env.PAGE_SIZE)
  }
}

module.exports = BaseModel
