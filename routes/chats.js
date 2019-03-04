const { Router } = require("express")
const { Commission } = require("../models")
const assert = require("http-assert")
const { pub, sub } = require("../lib/redis")
const log = require("../lib/log")

module.exports = Router()
  .use(async (req, res, next) => {
    // TODO: assert verified
    req.commission = await Commission.findById(req.params.commissionId)
    req.negotiation = await req.commission
      .$relatedQuery("negotiations")
      .where("artist_id", req.params.artistId)
      .where("is_artist", true)
      .first()

    // only the artist and the buyer can access
    assert(req.user, 401)
    next(
      assert(
        req.user.id == req.commission.buyerId ||
          req.user.id == req.negotiation.artistId,
        403
      )
    )
  })
  .get("/", async (req, res) => {
    const chats = await req.negotiation.paginate("chats", req.query.after)

    res.send(chats)
  })
  .ws("/", (ws, req) => {
    sub.on("message", (channel, message) => {
      // every time a message comes in from redis, post that
      if (channel == "chat" && message.startsWith(req.path)) {
        try {
          ws.send(message.substr(req.path.length + 1))
        } catch (err) {
          log.error(err)
        }
      }
    })
  })
  .post("/", async (req, res) => {
    const obj = { userId: req.user.id, message: req.body.body } // lol
    const chat = await req.negotiation.$relatedQuery("chats").insert(obj)

    res.status(201).send(chat)

    // publish to redis for live updates
    await pub.publish("chats", `${req.path}:${JSON.stringify(obj)}`)
  })
