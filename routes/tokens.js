const { Router } = require("express")
const { requireSignin } = require("../lib/middlewares")
const { addToken, removeToken } = require("../lib/token")

module.exports = Router()
  .post("/", requireSignin, async (req, res) => {
    res.status(201).send(await addToken(req.user))
  })
  .delete("/", async (req, res) => {
    if (req.token) await removeToken(req.token)

    res.sendStatus(204)
  })
