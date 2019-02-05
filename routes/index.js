const { Router } = require("express")
const sessions = require("./sessions")
const users = require("./users")

module.exports = Router()
  .use("/sessions", sessions)
  .use("/users", users)
