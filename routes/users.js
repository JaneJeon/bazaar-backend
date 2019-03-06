const { Router } = require("express")
const { User } = require("../models")
const tempToken = require("../lib/temp-token")
const assert = require("http-assert")
const upload = require("../config/multer")

module.exports = Router()
  // user info
  .get("/:userId(\\w+)", async (req, res) => {
    const user = await User.findByUserId(req.params.userId, req.user)

    res.send(user)
  })
  .get("/:userId(\\w+)/arts", async (req, res) => {
    const user = await User.findByUserId(req.params.userId, req.user)
    const arts = await user.paginate("arts", req.query.after)

    res.send(arts)
  })
  // a user's public commission listing
  .get("/:userId(\\w+)/commissions", async (req, res) => {
    const user = await User.findByUserId(req.params.userId, req.user)
    const commissions = await user
      .$relatedQuery("commissionsAsBuyer")
      .skipUndefined()
      .where("status", "open")
      .where("is_private", false)
      .where("id", "<", req.query.after)
      .orderBy("id")
      .limit(process.env.PAGE_SIZE)

    res.send(commissions)
  })
  .post("/", upload.single("avatar"), async (req, res) => {
    User.filterPost(req.body)
    if (this.file) req.body.avatar = this.file

    const user = await User.insert(req.body)
    const token = await tempToken.generate("verify", user.id, user.id)

    req.login(user, () => res.status(201).send(req.user))

    // email verification
    await user.sendEmail("verify", {
      url: `${process.env.FRONTEND_URL}/users/verify/${token}`
    })
  })
  // password reset when user forgets their password while logging in
  .post("/reset", async (req, res) => {
    const user = await User.findByEmail(req.body.email)
    const token = await tempToken.generate("reset", user.id, user.id)

    res.end()

    await user.sendEmail("reset", {
      url: `${process.env.FRONTEND_URL}/users/reset/${token}`
    })
  })
  .use((req, res, next) => next(assert(req.user, 401)))
  .patch("/", upload.single("avatar"), async (req, res) => {
    User.filterPatch(req.body)
    console.log("HERE", req.body)
    if (this.file) req.body.avatar = this.file

    const user = await req.user.patch(req.body)

    res.send(user)

    if (req.body.email) {
      const token = await tempToken.generate("verify", user.id, user.id)
      await user.sendEmail("verify", {
        url: `${process.env.FRONTEND_URL}/users/verify/${token}`
      })
    }
  })
  // verify user email
  .patch("/verify/:token", async (req, res) => {
    const id = await tempToken.fetch("verify", req.params.token)
    assert(id == req.user.id, 404)

    const user = await req.user.patch({ verified: true })

    res.send(user)

    await tempToken.consume("verify", id)
  })
  .patch("/reset/:token", async (req, res) => {
    const id = await tempToken.fetch("reset", req.params.token)
    assert(id == req.user.id, 404)

    const user = await req.user.patch({ password: req.body.password })

    res.send(user)

    await tempToken.consume("reset", id)
  })
  .delete("/", async (req, res) => {
    await req.user.$query().delete()

    req.session = null
    res.sendStatus(204)
  })
