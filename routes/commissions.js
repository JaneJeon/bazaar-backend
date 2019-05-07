const { Router } = require("express")
const { Commission } = require("../models")
const middlewares = require("../lib/middlewares")
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
  .get(
    "/:commissionId/transactions",
    middlewares.ensureSignedIn,
    async (req, res) => {
      const commission = await Commission.query().findById(
        req.params.commissionId
      )

      // check that you're either the artist or the buyer
      // (and, of course, the artist field could be empty)
      assert(
        req.user.id == commission.buyerId ||
          (commission.artistId && req.user.id == commission.artistId),
        403
      )

      const transactions = await commission
        .$relatedQuery("transactions")
        .selectWithAvatars()
        .paginate(req.query.after)

      res.send(transactions)
    }
  )
  .use(middlewares.ensureVerified)
  // change commission status, only available to the artist
  .patch("/:commissionId/reject", async (req, res) => {
    let commission = await req.user
      .$relatedQuery("commissionsAsArtist")
      .findById(req.params.commissionId)
    commission = await commission.$query().patch({ status: "reject" })

    res.send(commission)
  })
  .use(middlewares.ensureHasPayment)
  .post("/", async (req, res) => {
    Commission.filterPost(req.body)

    const commission = await req.user
      .$relatedQuery("commissionsAsBuyer")
      .insert(req.body)

    res.status(201).send(commission)
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
  // TODO: completed, cancelled
  .delete("/:commissionId", async (req, res) => {
    const commission = await req.user
      .$relatedQuery("commissionsAsBuyer")
      .findById(req.params.commissionId)
    await commission.$query().patch({ deleted: true })

    res.sendStatus(204)
  })
