const { Router } = require("express")
const { Commission, Review } = require("../models")
const assert = require("http-assert")

module.exports = Router()
  // commission board
  .get("/", async (req, res) => {
    // TODO: FOR NOW, the results are not personalized
    const commissions = await Commission.query()
      .selectWithAvatars()
      .where("is_private", false)
      .where("status", "open")
      .paginate(req.query.after)

    res.send(commissions)
  })
  .get("/:commissionId", async (req, res) => {
    const commission = await Commission.query()
      .selectWithAvatars()
      .findById(req.params.commissionId)

    res.send(commission)
  })
  .use((req, res, next) => next(req.ensureVerified()))
  .post("/", async (req, res) => {
    Commission.filterPost(req.body)

    const commission = await req.user
      .$relatedQuery("commissionsAsBuyer")
      .insert(req.body)

    res.status(201).send(commission)
  })
  .post("/:commissionId/reviews", async (req, res) => {
    Review.filterPost(req.body)

    const commission = await Commission.query().findById(
      req.params.commissionId
    )

    assert(
      req.user.id == commission.artistId || req.user.id == commission.buyerId,
      401
    )

    if (req.user.id == commission.buyerId) {
      req.body.reviewee_id = art.artistId
    } else [(req.body.reviewee_id = art.buyerId)]
    req.body.reviewer_id = req.user.id

    const review = commission.$relatedQuery("reviews").insert(req.body)

    res.status(201).send(review)
  })
  // change commission details, only available to the buyer
  .patch("/:commissionId", async (req, res) => {
    Commission.filterPatch(req.body)

    let commission = await req.user
      .$relatedQuery("commissionsAsBuyer")
      .findById(req.params.commissionId)
    commission = await commission.$query().patch(req.body)

    res.send(commission)
  })
  // change commission status, only available to the artist
  // accept is set from notifications
  .patch("/:commissionId/reject", async (req, res) => {
    let commission = await req.user
      .$relatedQuery("commissionsAsArtist")
      .findById(req.params.commissionId)
    commission = await commission.$query().patch({ status: "reject" })

    res.send(commission)
  })
  .patch("/:commissionId/reviews", async (req, res) => {
    Review.filterPatch(req.body)

    const commission = await Commission.query().findById(
      req.params.commissionId
    )

    assert(
      req.user.id == commission.artistId || req.user.id == commission.buyerId,
      401
    )

    await commission
      .$relatedQuery("reviews")
      .patch(req.body)
      .where("reviewer_id", req.user.id)

    res.status(204).send(review)
  })
  // TODO: completed, cancelled
  .delete("/:commissionId", async (req, res) => {
    const commission = await req.user
      .$relatedQuery("commissionsAsBuyer")
      .findById(req.params.commissionId)
    await commission.$query().patch({ deleted: true })

    res.sendStatus(204)
  })
  .delete("/:commissionId/reviews", async (req, res) => {
    const commission = await Commission.query().findById(
      req.params.commissionId
    )

    assert(
      req.user.id == commission.artistId || req.user.id == commission.buyerId,
      401
    )

    await commission
      .$relatedQuery("reviews")
      .delete()
      .where("reviewer_id", req.user.id)

    res.sendStatus(204)
  })
