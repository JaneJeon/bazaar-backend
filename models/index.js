const { Model } = require("objection")
const knex = require("knex")
const knexfile = require("../config/database")
const User = require("./user")
const Picture = require("./picture")

Model.knex(knex(knexfile)) // yo dawg

module.exports = { User, Picture }
