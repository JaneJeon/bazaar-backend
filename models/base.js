const { Model, snakeCaseMappers } = require("objection")
const { DbErrors } = require("objection-db-errors")
const tableName = require("@xyluet/objection-table-name")()
const isEmpty = require("lodash/isEmpty")
const assert = require("http-assert")
const algolia = require("../lib/algolia")
const memoize = require("lodash/memoize")
const algoliaIndex = memoize(str => algolia.initIndex(str))

class BaseModel extends tableName(DbErrors(Model)) {
  static get columnNameMappers() {
    return snakeCaseMappers()
  }

  static get modelPaths() {
    return [__dirname]
  }

  static get useLimitInFirst() {
    return true
  }

  static get defaultEagerAlgorithm() {
    return Model.JoinEagerAlgorithm
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
    return process.env.PAGE_SIZE
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

  static get index() {
    return algoliaIndex(this.tableName)
  }

  get algoliaId() {
    return Array.isArray(this.constructor.idColumn)
      ? this.constructor.idColumn.map(field => this[field]).join("-")
      : this[this.constructor.idColumn]
  }

  // rename fields for algolia indexing
  get algoliaCopy() {
    const copy = this.$clone()

    // id -> objectID
    copy.objectID = copy.algoliaId
    if (Array.isArray(this.constructor.idColumn)) {
      this.constructor.idColumn.forEach(field => delete copy[field])
    } else {
      delete copy[this.constructor.idColumn]
    }

    // tags -> _tags
    if (this.hasOwnProperty("tags")) {
      copy._tags = this.tags
      delete copy.tags
    }

    return copy
  }

  async $afterInsert(queryContext) {
    await super.$afterInsert(queryContext)
    await this.constructor.index.addObject(this.algoliaCopy)
  }

  async $afterUpdate(opt, queryContext) {
    await super.$afterUpdate(opt, queryContext)
    await this.constructor.index.partialUpdateObject(this.algoliaCopy)
  }

  async $afterDelete(queryContext) {
    await super.$afterDelete(queryContext)
    await this.constructor.index.deleteObject(this.algoliaId)
  }
}

module.exports = BaseModel
