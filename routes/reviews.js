const { Router } = require("express")
const { Review } = require("../models")

module.exports = Router()
  .use((req, res, next) => next(req.ensureVerified()))

  .post("/:userId", async (req, res) => {
    Review.filterPost(req.body)

    const reviewee = await User.query().findById(req.params.userId)

    const review = await req.user.$relatedQuery("review").insert(req.body)

    const reviewed = await reviewee.$relatedQuery("reviewed").insert(req.body)

    res.send(review)
  })

  .patch("/:userId/:reviewId", async (req, res) => {
    Review.filterPatch(req.body)

    const reviewee = await User.query().findById(req.params.userId)

    const review = await req.user
      .$query()
      .patch(req.body)
      .where("id", req.params.reviewId)

    const reviewed = await reviewee
      .$query()
      .patch(req.body)
      .where("id", req.params.reviewId)

    res.send(review)
  })

  .delete("/:userId/:reviewId", async (req, res) => {
    const reviewee = await User.query().findById(req.params.userId)

    const review = await req.user
      .$relatedQuery(review)
      .delete()
      .where("id", req.params.reviewId)

    const reviewed = await reviewee
      .$relatedQuery(reviewed)
      .delete()
      .where("id", req.params.reviewId)

    res.sendStatus(204)
  })
