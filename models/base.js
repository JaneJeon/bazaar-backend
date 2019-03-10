const { Model, snakeCaseMappers } = require("objection")
const { DbErrors } = require("objection-db-errors")
const tableName = require("@xyluet/objection-table-name")()
const isEmpty = require("lodash/isEmpty")
const assert = require("http-assert")

class BaseModel extends tableName(DbErrors(Model)) {
  static get columnNameMappers() {
    return snakeCaseMappers()
  }

  static get modelPaths() {
    return [__dirname]
  }

  static get reservedPostFields() {
    return []
  }

  static get reservedPatchFields() {
    return []
  }

  // some fields shouldn't be manually set
  static filterPost(body) {
    assert(!isEmpty(body), 400)

    this.reservedPostFields.forEach(field =>
      assert(body[field] === undefined, 400)
    )
  }

  static filterPatch(body) {
    assert(!isEmpty(body), 400)

    const fields = this.reservedPatchFields || this.reservedPostFields
    fields.forEach(field => assert(body[field] === undefined, 400))
  }

  static get pageSize() {
    return process.env.PAGE_SIZE || 15
  }

  static get QueryBuilder() {
    return class extends Model.QueryBuilder {
      findById(id) {
        return super.findById(id).throwIfNotFound()
      }

      paginate(after, sortField = "id") {
        return this.skipUndefined()
          .where(sortField, "<", after)
          .orderBy(sortField, "desc")
          .limit(this.modelClass().pageSize)
      }

      insert(obj) {
        let q = super.insert(obj).returning("*")
        if (!Array.isArray(obj)) q = q.first()

        return q
      }

      patch(obj) {
        return super.patch(obj).returning("*")
      }
    }
  }
}

module.exports = BaseModel
