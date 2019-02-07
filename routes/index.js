const { Router } = require("express")
const sessions = require("./sessions")
const users = require("./users")
const pictures = require("./pictures")

module.exports = Router()
  .use("/sessions", sessions)
  .use("/users", users)
  .use("/pictures", pictures)
