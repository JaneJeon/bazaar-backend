const { Router } = require("express")
const assert = require("http-assert")
const { Commission } = require("../models")

module.exports = Router()
  // commission board
  .get("/", async (req, res) => {
    // FOR NOW, the results are not personalized
    const commissions = await Commission.query()
      .skipUndefined()
      .where("is_private", false)
      .where("status", "open")
      .where("id", "<", req.query.after)
      .orderBy("id", "desc")
      .limit(process.env.PAGE_SIZE)

    res.send(commissions)
  })
  .get("/:commissionId", async (req, res) => {
    const commission = await Commission.findById(req.params.commissionId)

    res.send(commission)
  })
  .use((req, res, next) => next(assert(req.user && req.user.verified, 401)))
  // get commissions where the buyer specifically requested the artist
  .get("/forMe", async (req, res) => {
    const commissions = await Commission.query()
      .skipUndefined()
      .where("artist_id", req.user.id)
      .whereNot("status", req.query.excludeStatus || "rejected")
      .where("id", "<", req.query.after)
      .orderBy("id", "desc")
      .limit(process.env.PAGE_SIZE)

    res.send(commissions)
  })
  .post("/", async (req, res) => {
    Commission.filterRequest(req.body)

    const commission = await req.user
      .$relatedQuery("commissions")
      .insert(req.body)

    res.status(201).send(commission)
  })
