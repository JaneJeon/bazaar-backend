const { Router } = require("express")
const { Commission } = require("../models")
const assert = require("http-assert")
const { pub, sub } = require("../lib/redis")

module.exports = Router()
  .use(async (req, res, next) => {
    req.ensureVerified()
    req.commission = await Commission.findById(req.params.commissionId)
    req.negotiation = await req.commission
      .$relatedQuery("negotiations")
      .where("artist_id", req.params.artistId)
      .where("is_artist", true)
      .first()

    // only the artist and the buyer can access
    next(
      assert(
        req.user.id == req.commission.buyerId ||
          req.user.id == req.negotiation.artistId,
        403
      )
    )
  })
  // get previous chat records
  .get("/", async (req, res) => {
    const chats = await req.negotiation
      .$relatedQuery("chats")
      .paginate(req.query.after)

    res.send(chats)
  })
  .ws("/", (ws, req) => {
    // messages sent by the user
    ws.on("message", async message => {
      try {
        const obj = { userId: req.user.id, message }
        const chat = await req.negotiation.$relatedQuery("chats").insert(obj)

        await pub.publish("chats", `${req.path}:${JSON.stringify(chat)}`)
      } catch (err) {
        console.error(err)
      }
    })

    // messages from the other person
    sub.on("message", (channel, message) => {
      // every time a message comes in from redis, post that
      if (channel == "chat" && message.startsWith(req.path)) {
        try {
          ws.send(message.substr(req.path.length + 1))
        } catch (err) {
          console.error(err)
        }
      }
    })
  })
