const { Router } = require("express")
const { Review } = require("../models")
const assert = require("http-assert")
const { ensureIsVerified } = require("../lib/middlewares")

module.exports = Router()
  .get("/", async (req, res) => {
    const relation =
      req.query.as == "artist" ? "reviewsAsReviewee" : "reviewsAsReviewer"

    const reviews = await req.user
      .$relatedQuery(relation)
      .paginate(req.query.after)

    res.send(reviews)
  })
  .get("/:reviewId", async (req, res) => {
    // reviews are public
    const review = await Review.query().findById(req.params.reviewId)

    res.send(review)
  })
  .use(ensureIsVerified)
  .patch("/:reviewId", async (req, res) => {
    Review.filterPatch(req.body)

    let review = await Review.query().findById(req.user.id)

    assert(
      req.user.id == review.revieweeId || req.user.id == review.reviewerId,
      403
    )

    review = await review.patch(req.body)

    res.send(review)
  })
  .delete("/:reviewId", async (req, res) => {
    const review = await Review.query().findById(req.user.id)

    assert(
      req.user.id == review.revieweeId || req.user.id == review.reviewerId,
      403
    )

    await review.$query().delete()

    res.sendStatus(204)
  })
