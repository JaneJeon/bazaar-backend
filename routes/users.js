const { Router } = require("express")
const { User } = require("../models")
const redis = require("../config/redis")
const random = require("../config/random")
const ses = require("../config/ses")
const assert = require("http-assert")

module.exports = Router()
  // CREATE user - i.e. sign up
  .post("/", async (req, res) => {
    const { username, email, password } = req.body
    const user = await User.query().insert({ username, email, password })
    req.login(user, () => res.status(201).send({ data: req.user }))

    // email verification
    const token = await random.string(24)
    await redis.setex(`verify:${token}`, user.id, 86400)

    await ses.sendTemplatedEmail({
      Source: process.env.SENDER_ADDRESS,
      Template: "verify",
      Destination: { ToAddresses: [user.email] },
      TemplateData: { url: `${process.env.FRONTEND_URL}/users/verify/${token}` }
    })
  })
  // verify user email
  .patch("/verify/:token", async (req, res) => {
    const id = await redis.get(`verify:${req.params.token}`)
    await User.query()
      .patch({ verified: true })
      .where({ id })
      .whereNotDeleted()
    await redis.del(`verify:${token}`)

    res.end()
  })
  // password reset when user forgets their password while logging in
  .post("/reset", async (req, res) => {
    assert(req.body.email, 400)
    const id = await User.query()
      .where({ email: User.normalizeEmail(email) })
      .whereNotDeleted()
    res.end()

    const token = await random.string(24)
    await redis.setex(`reset:${token}`, id, 86400)

    await ses.sendTemplatedEmail({
      Source: process.env.SENDER_ADDRESS,
      Template: "reset",
      Destination: { ToAddresses: [req.body.email] },
      TemplateData: { url: `${process.env.FRONTEND_URL}/users/reset/${token}` }
    })
  })
  .patch("/reset/:token", async (req, res) => {
    const id = await redis.get(`verify:${req.params.token}`)
    await User.query()
      .patch({ password })
      .where({ id })
      .whereNotDeleted()

    res.end()
  })
  .use((req, res, next) => next(assert(req.user && req.user.verified, 401)))
