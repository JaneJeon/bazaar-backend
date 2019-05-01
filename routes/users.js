const { Router } = require("express")
const { User } = require("../models")
const tempToken = require("../lib/temp-token")
const assert = require("http-assert")
const upload = require("../config/multer")

module.exports = Router()
  // user info
  .get("/:userId", async (req, res) => {
    const user = await User.query().findById(req.params.userId, req.user)

    res.send(user)
  })
  .get("/:userId/arts", async (req, res) => {
    const user = await User.query().findById(req.params.userId, req.user)
    const arts = await user.$relatedQuery("arts").paginate(req.query.after)

    res.send(arts)
  })
  .get(":userId/arts/bought", async (req, res) => {
    const user = await User.query().findById(req.params.userId, req.user)
    const arts = await user
      .$relatedQuery("artsBought")
      .paginate(req.query.after)

    res.send(arts)
  })
  .get("/:userId/favorites", async (req, res) => {
    const user = await User.query().findById(req.params.userId, req.user)
    const arts = await user
      .$relatedQuery("favoriteArts")
      .paginate(req.query.after)

    res.send(arts)
  })
  .get("/:userId/review", async (req, res) => {
    const user = await User.query().findById(req.params.userId, req.user)

    const reviews = await userReview
      .$relatedQuery("review")
      .paginate(req.query.after)

    res.send(reviews)
  })
  .get("/:userId/reviewed", async (req, res) => {
    const user = await User.query().findById(req.params.userId, req.user)

    const reviewed = await userReview
      .$relatedQuery("reviewed")
      .paginate(req.query.after)

    res.send(reviewed)
  })
  .get("/:userId/commissions", async (req, res) => {
    const user = await User.query().findById(req.params.userId, req.user)
    let commissions

    if (user.id == (req.user || {}).id) {
      // load a user's own commissions, defaulting to as=buyer

      commissions = await user
        .$relatedQuery(
          req.query.as == "artist"
            ? "commissionsAsArtist"
            : "commissionsAsBuyer"
        )
        .where("status", req.query.status || "open")
        .paginate(req.query.after)
    } else {
      // public, open commissions by the user
      commissions = await user
        .$relatedQuery("commissionsAsBuyer")
        .where("status", "open")
        .where("is_private", false)
        .paginate(req.query.after)
    }

    res.send(commissions)
  })
  .post("/", upload.single("avatar"), async (req, res) => {
    User.filterPost(req.body)
    if (req.file) req.body.avatar = req.file

    const user = await User.query().insert(req.body)
    const token = await tempToken.generate("verify", user.id, user.id)

    req.login(user, () => res.status(201).send(req.user))

    // email verification
    await user.sendEmail("verify", {
      url: `${process.env.FRONTEND_URL}/users/verify?token=${token}`
    })
  })
  // password reset when user forgets their password while logging in
  .post("/reset", async (req, res) => {
    const user = await User.query().findByEmail(req.body.email)
    const token = await tempToken.generate("reset", user.id, user.id)

    res.end()

    await user.sendEmail("reset", {
      url: `${process.env.FRONTEND_URL}/users/reset?token=${token}`
    })
  })
  .patch("/verify", async (req, res) => {
    const id = await tempToken.fetch("verify", req.query.token)
    let user = await User.query().findById(id)

    user = await user.$query().patch({ verified: true })

    res.send(user)

    await tempToken.consume("verify", id)
  })
  .patch("/reset", async (req, res) => {
    const id = await tempToken.fetch("reset", req.query.token)
    let user = await User.query().findById(id)

    user = await user.$query().patch({ password: req.body.password })

    res.send(user)

    await tempToken.consume("reset", id)
  })
  .use((req, res, next) => next(assert(req.user, 401)))
  .patch("/", upload.single("avatar"), async (req, res) => {
    User.filterPatch(req.body)
    console.log("HERE", req.body)
    if (req.file) req.body.avatar = req.file

    const user = await req.user.$query().patch(req.body)

    res.send(user)

    if (req.body.email) {
      const token = await tempToken.generate("verify", user.id, user.id)
      await user.sendEmail("verify", {
        url: `${process.env.FRONTEND_URL}/users/verify/${token}`
      })
    }
  })
  .delete("/", async (req, res) => {
    await req.user.$query().patch({ deleted: true })

    req.session = null
    res.sendStatus(204)
  })
