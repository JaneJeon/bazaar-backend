const { Router } = require("express")
const { requireSignin } = require("../lib/middlewares")
const token = require("../lib/token")

module.exports = Router()
  .post("/", requireSignin, (req, res) => {
    res.status(201).send(req.user.JWT)
  })
  .delete("/", async (req, res) => {
    await token.blacklist(req.token)
    res.sendStatus(204)
  })
