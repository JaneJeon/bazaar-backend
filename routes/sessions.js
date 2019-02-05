const { Router } = require("express")
const passport = require("passport")

module.exports = Router()
  // CREATE session
  .post("/login", passport.authenticate("local"), (req, res) =>
    res.sendStatus(201)
  )
  // DELETE session
  .delete("/logout", (req, res) => {
    req.logout()
    res.sendStatus(204)
  })
