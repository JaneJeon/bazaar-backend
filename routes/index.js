const { Router } = require("express")
const sessions = require("./sessions")
const users = require("./users")
const arts = require("./arts")

module.exports = Router()
  .use("/sessions", sessions)
  .use("/users", users)
  .use("/arts", arts)
