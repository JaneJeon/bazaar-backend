const { Router } = require("express")
const { Report } = require("../models")
const middlewares = require("../lib/middlewares")

module.exports = Router()
  .get("/", middlewares.ensureAdmin, async (req, res) => {
    const reports = await Report.query().paginate(req.query.after)

    res.send(reports)
  })
  .post("/", async (req, res) => {
    // TODO
  })
