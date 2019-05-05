// https://github.com/brianc/node-pg-types#use
const { types } = require("pg")
const dayjs = require("dayjs")
types.setTypeParser(20, parseInt) // cast SELECT COUNT(*) to integer
types.setTypeParser(1082, obj => dayjs(obj).format("YYYY-MM-DD"))

const { Model } = require("objection")
const knex = require("knex")
const knexfile = require("../config/database")
const User = require("./user")
const Art = require("./art")
const Commission = require("./commission")
const Negotiation = require("./negotiation")
const Chat = require("./chat")
const Review = require("./review")
const Favorite = require("./favorite")
const Update = require("./update")

Model.knex(knex(knexfile)) // yo dawg

module.exports = {
  User,
  Art,
  Commission,
  Negotiation,
  Chat,
  Review,
  Favorite,
  Update
}
