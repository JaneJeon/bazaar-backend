const { Router } = require("express")
const { Transaction } = require("../models")
const { ensureIsVerified } = require("../lib/middlewares")
const assert = require("http-assert")

module.exports = Router()
  .use(ensureIsVerified)
  .get("/", async (req, res) => {
    // list transactions for a user
    const relation =
      req.query.as == "artist" ? "transactionsAsArtist" : "transactionsAsBuyer"

    const transactions = await req.user
      .$relatedQuery(relation)
      .selectWithAvatars()
      .paginate(req.query.after)

    res.send(transactions)
  })
  .get("/:transactionId", async (req, res) => {
    const transaction = await Transaction.query()
      .selectWithAvatars()
      .findById(req.params.transactionId)

    // check a user has rights OR is an admin
    assert(
      req.user.id == transaction.artistId ||
        req.user.id == transaction.buyerId ||
        req.user.isAdmin,
      403
    )

    res.send(transaction)
  })
  .post("/:transactionId/reports", async (req, res) => {
    // report a transaction
    const transaction = await Transaction.query()
      .selectWithAvatars()
      .findById(req.params.transactionId)

    assert(
      req.user.id == transaction.artistId || req.user.id == transaction.buyerId,
      403
    )

    const report = await req.user
      .$relatedQuery("reports")
      .insert({ transactionId: transaction.id, details: req.body.details })

    res.status(201).send(report)
  })
