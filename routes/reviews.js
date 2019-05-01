const { Router } = require("express")
const { Review } = require("../models")

module.exports = Router()

  .use((req, res, next) => next(req.ensureVerified()))

  .post("/:userId", async (req, res) => {

    Review.filterPost(req.body)

    const reviewee = await User.query().findById(req.params.userId)

    const review = await req.user
      .$relatedQuery("review")
      .insert(req.body)

    const reviewed = await reviewee
      .$relatedQuery("reviewed")
      .insert(req.body)

    res.send(review)

  })

  .patch("/", async (req, res) => {

    Review.filterPatch(req.body)

    const reviewee = await User.query().findById(req.params.userId)

    const review = await req.user
    .$query()
    .patch(req.body)
    .where("user_id", req.user.id)

    const reviewed = await reviewee
    .$query()
    .patch(req.body)
    .where("user_id", reviewee.id)

    res.send(review)

    })

  .delete("/", async (req, res) => {


    const reviewee = await User.query().findById(req.params.userId)

    const review = await req.user
    .$relatedQuery(review)
    .delete()
    .where("user_id", req.user.id)

    const reviewed = await reviewee
    .$relatedQuery(reviewed)
    .delete()
    .where("user_id", reviewee.id)

    res.sendStatus(204)

    })
