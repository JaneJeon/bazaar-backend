const { Router } = require("express")
const assert = require("http-assert")
const { Commission } = require("../models")

module.exports = Router()
  .get("/", async (req, res) => {
    // FOR NOW, the results are not personalized
    const commissions = await Commission.paginate(req.query.after)

    res.send(commissions)
  })
  .get("/:commissionId", async (req, res) => {
    const commission = await Commission.findById(req.params.commissionId)

    res.send(commission)
  })
  .use((req, res, next) => next(assert(req.user && req.user.verified, 401)))
  .get("/me", async (req, res) => {
    let q
    if (req.query.as == "artist") {
      q = req.user.$relatedQuery("commissionsAsArtist")
      if (req.query.show != "all") q = q.whereNot("status", "rejected")
    } else {
      q = req.user.$relatedQuery("commissionsAsBuyer")
    }

    const commissions = await q.whereNotDeleted()

    res.send(commissions)
  })
  .post("/", async (req, res) => {
    Commission.filterRequest(req)

    const commission = await req.user
      .$relatedQuery("commissions")
      .insert(req.body)

    res.status(201).send(commission)
  })
