const { Router } = require("express")
const passport = require("passport")
const assert = require("http-assert")

module.exports = Router()
  // CREATE session
  .post("/", passport.authenticate("local"), (req, res) => {
    assert(req.user.banned == false, 401)
    res.status(201).send(req.user.stripeCopy)
  })
  // DELETE session
  .delete("/", (req, res) => {
    req.session = null
    res.sendStatus(204)
  })
