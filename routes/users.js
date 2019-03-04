const { Router } = require("express")
const { User } = require("../models")
const tempToken = require("../models/temp-token")
const assert = require("http-assert")
const upload = require("../config/multer")

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
  .use((req, res, next) => next(req.user, 401))
  .patch("/", upload.single("avatar"), async (req, res) => {
    User.filterPatch(req)
    if (this.file) req.body.avatar = this.file

    const user = await req.user.patch(req.body)

    res.send(user)

    if (req.body.email) {
      const token = await tempToken.generate("reset", user.id, user.id)
      await user.sendEmail("verify", {
        url: `${process.env.FRONTEND_URL}/users/verify/${token}`
      })
    }
  })
  // verify user email
  .patch("/verify/:token", async (req, res) => {
    const id = await tempToken.fetch("verify", req.params.token)
    assert(id == req.user.id, 403)

    const user = await req.user.patch({ verified: true })

    res.send(user)

    await tempToken.consume("verify", id)
  })
  .patch("/reset/:token", async (req, res) => {
    const id = await tempToken.fetch("reset", req.params.token)
    assert(id == req.user.id, 403)

    const user = await req.user.patch({ password })

    res.send(user)

    await tempToken.consume("reset", id)
  })
  .delete("/", async (req, res) => {
    await req.user.$query().delete()

    req.logout()
    res.sendStatus(204)
  })
