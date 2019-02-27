const { Router } = require("express")
const { User } = require("../models")
const redis = require("../config/redis")
const { sync: uid } = require("uid-safe")
const ses = require("../lib/ses")
const assert = require("http-assert")

module.exports = Router()
  // user info
  .get("/:userId", async (req, res) => {
    const user = await User.findById(req.params.userId)

    res.send(user)
  })
  .get("/:userId/arts", async (req, res) => {
    const artist = await User.findById(req.params.userId)
    const arts = await artist.paginate("arts", req.query.after)

    res.send(arts)
  })
  .post("/", async (req, res) => {
    User.filterRequest(req)

    const user = await User.query().insert(req.body)
    req.login(user, () => res.status(201).send(req.user))

    // email verification
    const token = uid(24)
    await redis.setex(`verify:${token}`, 86400, user.id)

    await ses
      .sendTemplatedEmail({
        Source: process.env.SENDER_ADDRESS,
        Template: "verify",
        Destination: { ToAddresses: [user.email] },
        TemplateData: JSON.stringify({
          url: `${process.env.FRONTEND_URL}/users/verify/${token}`
        })
      })
      .promise()
  })
  // verify user email
  .patch("/verify/:token", async (req, res) => {
    const id = await redis.get(`verify:${req.params.token}`)
    await User.query()
      .patch({ verified: true })
      .where({ id })
    await redis.del(`verify:${req.params.token}`)

    res.end()
  })
  // password reset when user forgets their password while logging in
  .patch("/reset", async (req, res) => {
    const id = await User.findByEmail(req.body.email)
    res.end()

    const token = uid(24)
    await redis.setex(`reset:${token}`, 86400, id)

    await ses
      .sendTemplatedEmail({
        Source: process.env.SENDER_ADDRESS,
        Template: "reset",
        Destination: { ToAddresses: [req.body.email] },
        TemplateData: JSON.stringify({
          url: `${process.env.FRONTEND_URL}/users/reset/${token}`
        })
      })
      .promise()
  })
  .patch("/reset/:token", async (req, res) => {
    const id = await redis.get(`reset:${req.params.token}`)
    await User.query()
      .patch({ password })
      .where({ id })
    await redis.del(`reset:${req.params.token}`)

    res.end()
  })
  .use((req, res, next) => next(assert(req.user && req.user.verified, 401)))
