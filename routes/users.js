const { Router } = require("express")
const { User } = require("../models")
const tempToken = require("../lib/temp-token")
const upload = require("../config/multer")
const middlewares = require("../lib/middlewares")

module.exports = Router()
  // user info
  .get("/:userId", async (req, res) => {
    const user = await User.query().findById(req.params.userId, req.user)

    res.send(user)
  })
  .get("/:userId/arts", async (req, res) => {
    const user = await User.query().findById(req.params.userId, req.user)
    const arts = await user
      .$relatedQuery("arts")
      .selectWithFavorite(user.id)
      .paginate(req.query.after)
      .where("status", req.query.status)

    res.send(arts)
  })
  .get("/:userId/artsBought", async (req, res) => {
    const user = await User.query().findById(req.params.userId, req.user)
    const arts = await user
      .$relatedQuery("artsBought")
      .selectWithFavorite(user.id)
      .paginate(req.query.after)

    res.send(arts)
  })
  .get("/:userId/favorites", async (req, res) => {
    const user = await User.query().findById(req.params.userId, req.user)
    const arts = await user
      .$relatedQuery("favoriteArts")
      .selectWithFavorite((req.user || {}).id)
      .paginate(req.query.after)
      .where("status", req.query.status)

    res.send(arts)
  })
  .get("/:userId/reviews", async (req, res) => {
    const user = await User.query().findById(req.params.userId, req.user)
    const relation =
      req.query.as == "reviewer" ? "reviewsAsReviewer" : "reviewsAsReviewee"

    const reviews = await user.$relatedQuery(relation).paginate(req.query.after)

    res.send(reviews)
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
        .selectWithAvatars()
        .where("status", req.query.status || "open")
        .paginate(req.query.after)
    } else {
      // public, open commissions by the user
      commissions = await user
        .$relatedQuery("commissionsAsBuyer")
        .selectWithAvatars()
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

    req.login(user, () => res.status(201).send(req.user.stripeCopy))

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
  .use(middlewares.ensureSignedIn)
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
  .patch("/:userId/ban", async (req, res) => {
    assert(req.user.role == "superuser" || req.user.role == "admin", 401)
    const user = await User.query().findById(req.params.userId)

    if (req.query.action == "revoke") {
      user = await user.$query().patch({ banned: false })
    } else {
      user = await user.$query().patch({ banned: true })
    }

    res.send(user)
  })
  .patch("/:userId/promote", async (req, res) => {
    assert(req.user.role == "superuser", 401)

    const user = await User.query().findById(req.params.userId)

    if (req.query.action == "demote") {
      user = await user.$query().patch({ role: "user" })
    } else {
      user = await user.$query().patch({ role: "admin" })
    }
    res.send(user)
  })
  .delete("/", async (req, res) => {
    await req.user.$query().patch({ deleted: true })

    req.session = null
    res.sendStatus(204)
  })
