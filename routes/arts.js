const { Router } = require("express")
const upload = require("../config/multer")
const { Art } = require("../models")
const assert = require("http-assert")

module.exports = Router()
  // the "discover" page
  .get("/", async (req, res) => {
    // FOR NOW, the results are not personalized
    const arts = await Art.paginate(req.query.after)

    res.send(arts)
  })
  .get("/:artId", async (req, res) => {
    const art = await Art.findById(req.params.artId)

    res.send(art)
  })
  .use((req, res, next) => next(assert(req.user && req.user.verified, 401)))
  .post(
    "/",
    upload.array("pictures", process.env.MAX_PICTURE_ATTACHMENTS),
    async (req, res) => {
      Art.filterRequest(req.body)
      req.body.pictures = req.files.map(file => file.path)

      const art = await req.user.$relatedQuery("arts").insert(req.body)

      res.status(201).send(art)
    }
  )
