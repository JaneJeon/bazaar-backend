const { Router } = require("express")
const upload = require("../config/multer")
const { Picture } = require("../models")

module.exports = Router()
  .get("/") // TODO: this is the "dashboard"
  .post("/", upload.single(), async (req, res) => {
    const { title, description } = req.body
    const url = req.file.location
    const picture = await Picture.query().insert({ title, description, url })

    res.status(201).send({ picture })
  })
