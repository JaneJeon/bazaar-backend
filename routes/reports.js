const { Router } = require("express")
const { Report } = require("../models")

module.exports = Router()
  .get("/", async (req, res) => {
    const reports = await Report.query().paginate(req.query.after)

    res.send(reports)
  })
  .get("/:reportId", async (req, res) => {
    const report = await Report.query().findById(req.params.reportId)

    res.send(report)
  })
