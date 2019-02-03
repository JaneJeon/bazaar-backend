const { Model } = require("objection")
const knex = require("knex")
const knexfile = require("../knexfile")
const User = require("./user")

Model.knex(knex(knexfile)) // yo dawg

module.exports = { User }
