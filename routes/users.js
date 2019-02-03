const { Router } = require("express")
const { User } = require("../models")
const passport = require("passport")

module.exports = Router()
  .post("/", async (req, res) => {
    const user = await User.query().insert({
      username: req.body.username,
      email: req.body.email,
      password: req.body.password
    })

    req.login(user, () => res.status(201).send({ user: req.user }))
  }) // CREATE user - i.e. sign up
  .post("/login", passport.authenticate("local"), (req, res) =>
    res.sendStatus(201)
  ) // CREATE session
  .delete("/logout", (req, res) => {
    req.logout()
    res.sendStatus(204)
  }) // DELETE session
