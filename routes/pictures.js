const { Router } = require("express")
const upload = require("../config/multer")
const { Picture } = require("../models")
const POSTGRES_MAX_INT = 2147483647

module.exports = Router()
  // create a single picture
  .post("/", upload.single("picture"), async (req, res) => {
    const { title, description } = req.body
    const url = req.file.path
    const picture = await Picture.query().insert({ title, description, url })

    res.status(201).send({ picture })
  })
  // dashboard for this person
  .get("/explore", async (req, res) => {
    // FOR NOW, we're using id as the bookmark
    const pictures = await Picture.query()
      .where("id", "<", req.body.after || POSTGRES_MAX_INT)
      .orderBy("id", "desc")
      .limit(process.env.PAGE_SIZE)

    res.send({ pictures })
  })
