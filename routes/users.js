const { Router } = require("express")
const { User } = require("../models")
const tempToken = require("../models/temp-token")
const ses = require("../lib/ses")
const assert = require("http-assert")

module.exports = Router()
  // user info
  .get("/:userId", async (req, res) => {
    const user = await User.findByUserId(req.params.userId, req.user)

    res.send(user)
  })
  .get("/:userId/arts", async (req, res) => {
    const user = await User.findByUserId(req.params.userId, req.user)
    const arts = await user.paginate("arts", req.query.after)

    res.send(arts)
  })
  .get("/:userId/commissions", async (req, res) => {
    const user = await User.findByUserId(req.params.userId, req.user)

    let q =
      req.query.as == "buyer"
        ? user.$relatedQuery("commissionsAsBuyer")
        : user.$relatedQuery("commissionsAsArtist")

    // if you're looking at others' commissions, you can only see public ones
    if (req.user.id != user.id) q = q.where("is_private", false)

    const commissions = await q
      .skipUndefined()
      .where("status", req.query.status)
      .where("id", "<", req.query.after)
      .orderBy("id", "desc")
      .limit(process.env.PAGE_SIZE)

    res.send(commissions)
  })
  .post("/", async (req, res) => {
    User.filterRequest(req.body)

    const user = await User.query().insert(req.body)
    const token = await tempToken.generate("verify", user.id, user.id)

    req.login(user, () => res.status(201).send(req.user))

    // email verification
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
    const id = await tempToken.fetch("verify", req.params.token)
    const user = await User.findByUserId(id, req.user)
    await user.$query().patch({ verified: true })

    res.end()

    await tempToken.consume("verify", id)
  })
  // password reset when user forgets their password while logging in
  .patch("/reset", async (req, res) => {
    const user = await User.findByEmail(req.body.email)
    const token = await tempToken.generate("reset", user.id, user.id)

    res.end()

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
    const id = await tempToken.fetch("reset", req.params.token)
    const user = await User.findByUserId(id, req.user)
    await user.$query().patch({ password })

    res.end()

    await tempToken.consume("reset", id)
  })
  .use((req, res, next) => next(assert(req.user && req.user.verified, 401)))
