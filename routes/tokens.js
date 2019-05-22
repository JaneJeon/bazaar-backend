const { Router } = require("express")
const { requireSignin } = require("../lib/middlewares")
const { removeToken } = require("../lib/token")

module.exports = Router()
  .post("/", requireSignin, (req, res) => {
    res.status(201).send(req.user.JWT)
  })
  .delete("/", async (req, res) => {
    await removeToken(req.token)

    res.sendStatus(204)
  })
