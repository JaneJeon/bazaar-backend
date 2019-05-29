const { Router } = require("express")
const { Commission } = require("../models")
const assert = require("http-assert")
const { pub, sub } = require("../lib/redis")
const { ensureIsVerified } = require("../lib/middlewares")
const log = require("../lib/logger")
const ongoingStatuses = ["open", "accepted", "in progress"]

module.exports = Router({ mergeParams: true })
  .use(ensureIsVerified)
  .use(async (req, res, next) => {
    req.commission = await Commission.query().findById(req.params.commissionId)
    req.artistId = req.query.artistId || req.commission.artistId

    // a chat only works with 2 people
    assert(req.artistId, 400)
    // limit chat to only the buyer and the artist
    assert(
      req.user.id == req.commission.buyerId || req.user.id == req.artistId,
      403
    )
    // and only allow chat when either the negotiation or the commission is ongoing
    next(assert(ongoingStatuses.includes(req.commission.status), 405))
  })
  // get previous chat records
  .get("/", async (req, res) => {

    if (req.commission.status == "open" || req.commission.status == "accepted") {
      const negotiation = await req.commission
        .$relatedQuery("negotiations")
        .where("artist_id", req.artistId)
        .where("is_artist", true)
        .first()
        .throwIfNotFound()

      const chats = await negotiation
        .$relatedQuery("chats")
        .paginate(req.query.after)
    }
    else {
      const chats = await req.commission
        .$relatedQuery("chats")
        .paginate(req.query.after)
    }

    res.send(chats)
  })
  .ws("/", (ws, req) => {
    const room = `${req.commission.id}:${req.artistId}`

    // messages sent by the user
    ws.on("message", async message => {
      try {
        const obj = { userId: req.user.id, message }
        if (req.commission.status == "open" || req.commission.status == "accepted") {
          const negotiation = await req.commission
            .$relatedQuery("negotiations")
            .where("artist_id", req.artistId)
            .where("is_artist", true)
            .first()
            .throwIfNotFound()

            const chat = await negotiation.$relatedQuery("chats").insert(obj)
        }
        else {
            const chat = await req.commission.$relatedQuery("chats").insert(obj)
        }

        await pub.publish("chat", `${room}:${JSON.stringify(chat)}`)
      } catch (err) {
        log.error(err)
      }
    })

    // messages from the other person
    sub.on("message", (channel, message) => {
      // every time a message comes in from redis, post that
      if (channel == "chat" && message.startsWith(room)) {
        try {
          ws.send(message.substr(room.length + 1))
        } catch (err) {
          log.error(err)
        }
      }
    })
  })
