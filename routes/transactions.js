const { Router } = require("express")
const { Transaction } = require("../models")
const middlewares = require("../lib/middlewares")

module.exports = Router()
  .use(middlewares.ensureHasPayment)
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
    // TODO: check a user has rights OR is an admin?
  })
  .post("/:transactionId/reports", async (req, res) => {
    // TODO: report a transaction
  })
