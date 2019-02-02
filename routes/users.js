const { Router } = require("express")

module.exports = Router()
  .post("/") // CREATE user - i.e. sign up
  .post("/login") // CREATE session - i.e. sign in
  .delete("/logout") // DELETE session - i.e. logout
