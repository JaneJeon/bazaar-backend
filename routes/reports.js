const { Router } = require("express")
const { Report } = require("../models")
const assert = require("http-assert")

module.exports = Router()
  .use((req, res, next) => {
    assert(req.user.role == "admin" || req.user.role == "superuser")
    next()
  })
  .get("/", async (req, res) => {
    const reports = await Report.query().paginate(req.query.after)

    res.send(reports)
  })
