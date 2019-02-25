const { Router } = require("express")
const assert = require("http-assert")
const { Commission } = require("../models")
const POSTGRES_MAX_INT = 2147483647

module.exports = Router()
  .get("/", async (req, res) => {
    // FOR NOW, we're using id as the bookmark
    // FOR NOW, the results are not personalized
    const commissions = await Commission.query()
      .where("id", "<", req.body.after || POSTGRES_MAX_INT)
      .orderBy("id", "desc")
      .limit(process.env.PAGE_SIZE)

    res.send(commissions)
  })
  .get("/:commissionId", async (req, res) => {
    const commission = await Commission.query().findById(
      req.params.commissionId
    )

    res.send(commission)
  })
  .use((req, res, next) => next(assert(req.user && req.user.verified, 401)))
  .get("/me", async (req, res) => {
    if (req.query.as == "artist") {
      const q = req.user.$relatedQuery("commissionRequests")
      let commissions

      if (req.query.show != "all") commissions = await q
      else commissions = await q.whereNot("status", "rejected")

      res.send(commissions)
    } else {
      const commissions = await req.user.$relatedQuery("commissions")
      res.send(commissions)
    }
  })
  .post("/", async (req, res) => {
    delete req.body.status
    delete req.body.tags

    const commission = await req.user
      .$relatedQuery("commissions")
      .insert(req.body)

    res.status(201).send(commission)
  })
