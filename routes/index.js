const { Router } = require("express")
const users = require("./users")

module.exports = Router().use("/users", users)
