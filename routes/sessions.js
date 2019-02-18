const { Router } = require("express")
const passport = require("passport")

module.exports = Router()
  // CREATE session
  .post("/", passport.authenticate("local"), (req, res) =>
    res.status(201).send(req.user)
  )
  // DELETE session
  .delete("/", (req, res) => {
    req.logout()
    res.sendStatus(204)
  })
