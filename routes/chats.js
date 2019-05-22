const { Router } = require("express")
const { Commission } = require("../models")
const assert = require("http-assert")
const { pub, sub } = require("../lib/redis")
const { requireAuth, ensureIsVerified } = require("../lib/middlewares")

module.exports = Router({ mergeParams: true })
  .use(requireAuth, ensureIsVerified)
  .use(async (req, res, next) => {
    req.commission = await Commission.query().findById(req.params.commissionId)

    if (req.commission.status == "open") {
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
    } else if (
      req.commission.status != "completed" &&
      req.commission.status != "cancelled"
    ) {
      next(req.commission.ensureIsArtistOrBuyer(req.user))
      // disallow chat after it's done
    } else next(assert(false, 405))
  })
  // get previous chat records
  .get("/", async (req, res) => {
    if (req.commission.status == "open") {
      const chats = await req.negotiation
        .$relatedQuery("chats")
        .paginate(req.query.after)

      res.send(chats)
    } else {
      const chats = await req.commission
        .$relatedQuery("chats")
        .paginate(req.query.after)

      res.send(chats)
    }
  })
  .ws("/", (ws, req) => {
    const room = `${req.params.commissionId}:${req.params.artistId}`

    // messages sent by the user
    ws.on("message", async message => {
      try {
        const obj = { userId: req.user.id, message }
        if (req.commission.status == "open") {
          const chat = await req.negotiation.$relatedQuery("chats").insert(obj)
        } else {
          const chat = await req.commission.$relatedQuery("chats").insert(obj)
        }

        await pub.publish("chat", `${room}:${JSON.stringify(chat)}`)
      } catch (err) {
        console.error(err)
      }
    })

    // messages from the other person
    sub.on("message", (channel, message) => {
      // every time a message comes in from redis, post that
      if (channel == "chat" && message.startsWith(room)) {
        try {
          ws.send(message.substr(room.length + 1))
        } catch (err) {
          console.error(err)
        }
      }
    })
  })
