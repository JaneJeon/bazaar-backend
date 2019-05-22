// https://github.com/brianc/node-pg-types#use
const { types } = require("pg")
const dayjs = require("dayjs")
types.setTypeParser(20, parseInt) // cast SELECT COUNT(*) to integer
types.setTypeParser(1082, obj => dayjs(obj).format("YYYY-MM-DD"))

const { Model } = require("objection")
const User = require("./user")
const Art = require("./art")
const Commission = require("./commission")
const Negotiation = require("./negotiation")
const Chat = require("./chat")
const Review = require("./review")
const Favorite = require("./favorite")
const Update = require("./update")
const Transaction = require("./transaction")
const Report = require("./report")

Model.knex(require("knex")(require("../config/database")))

module.exports = {
  User,
  Art,
  Commission,
  Negotiation,
  Chat,
  Review,
  Favorite,
  Update,
  Transaction,
  Report
}
