const { Router } = require("express")
const users = require("./users")
const assert = require("http-assert")

module.exports = Router()
  .use("/users", users)
  // ensure people are logged in
  .use((req, res, next) => assert(req.user, 401))
