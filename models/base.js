const { Model, snakeCaseMappers } = require("objection")
const { DbErrors } = require("objection-db-errors")
const { default: visibility } = require("objection-visibility")
const tableName = require("@xyluet/objection-table-name")()
const assert = require("http-assert")

class BaseModel extends tableName(visibility(DbErrors(Model))) {
  static get columnNameMappers() {
    return snakeCaseMappers()
  }

  static get modelPaths() {
    return [__dirname]
  }

  static get reservedPostFields() {
    return []
  }

  // some fields shouldn't be manually set
  static async filterPost(body) {
    this.reservedPostFields.forEach(field =>
      assert(body[field] === undefined, 400)
    )
  }

  static async filterPatch(body) {
    const fields = this.reservedPatchFields || this.reservedPostFields

    fields.forEach(field => assert(body[field] === undefined, 400))
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

  static async paginate(after, sortField = "id", trx) {
    let q = this.query(trx)
      .skipUndefined()
      .where(sortField, "<", after)
    if (this.isSoftDelete) q = q.whereNotDeleted()
    return q.orderBy(sortField, "desc").limit(process.env.PAGE_SIZE)
  }

  async paginate(ref, after, sortField = "id", trx) {
    return this.$relatedQuery(ref, trx)
      .skipUndefined()
      .where(sortField, "<", after)
      .orderBy(sortField, "desc")
      .limit(process.env.PAGE_SIZE)
  }

  static async insert(obj, trx) {
    return this.query(trx)
      .insert(obj)
      .returning("*")
      .first()
  }

  async insert(ref, obj, trx) {
    return this.$relatedQuery(ref, trx)
      .insert(obj)
      .returning("*")
      .first()
  }

  async patch(obj, trx) {
    return this.$query(trx)
      .patch(obj)
      .returning("*")
      .first()
  }
}

module.exports = BaseModel
