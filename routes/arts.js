const { Router } = require("express")
const upload = require("../config/multer")
const { Art, Review } = require("../models")
const { transaction } = require("objection")
const { ensureIsVerified, ensureHasPayment } = require("../lib/middlewares")
const assert = require("http-assert")

module.exports = Router()
  // the "discover" page
  .get("/", async (req, res) => {
    // TODO: FOR NOW, the results are not personalized
    const arts = await Art.query()
      .selectWithFavorite((req.user || {}).id)
      .paginate(req.query.after)
      .where("status", req.query.status)

    res.send(arts)
  })
  .get("/:artId", async (req, res) => {
    const art = await Art.query()
      .skipUndefined()
      .selectWithFavorite((req.user || {}).id)
      .findById(req.params.artId)
      .where("status", req.query.status)

    res.send(art)
  })
  .get("/:artId/favorites", async (req, res) => {
    const art = await Art.query().findById(req.params.artId)
    const favorites = await art
      .$relatedQuery("favoriteUsers")
      .paginate(req.query.after)

    res.send(favorites)
  })
  .use(ensureIsVerified)
  .get("/:artId/transactions", async (req, res) => {
    const art = await Art.query().findById(req.params.artId)

    // check that you're either the artist or the buyer
    assert(
      req.user.id == art.id ||
        (await art
          .$relatedQuery("transactions")
          .where("buyer_id", req.user.id)
          .count()),
      403
    )

    const transactions = await art
      .$relatedQuery("transactions")
      .selectWithAvatars()
      .paginate(req.query.after)

    res.send(transactions)
  })
  .post(
    "/",
    upload.array("pictures", process.env.MAX_PICTURE_ATTACHMENTS),
    async (req, res) => {
      Art.filterPost(req.body)
      req.body.pictures = Array.from(req.files).map(file => file.path)

      const art = await req.user.$relatedQuery("arts").insert(req.body)

      res.status(201).send(art)
    }
  )
  .post("/:artId/favorites", async (req, res) => {
    const art = await Art.query().findById(req.params.artId)

    const favorite = await art
      .$relatedQuery("favoriteUsers")
      .relate(req.user.id)

    res.status(201).send(favorite)
  })
  // add a review about the other party
  .post("/:artId/reviews", async (req, res) => {
    Review.filterPost(req.body)

    const art = await Art.query().findById(req.params.artId)

    // check that you're either the artist or the buyer
    assert(
      req.user.id == art.id ||
        (await art
          .$relatedQuery("transactions")
          .where("buyer_id", req.user.id)
          .count()),
      403
    )

    req.body.revieweeId =
      req.user.id == art.artistId ? art.buyerId : art.artistId
    req.body.reviewerId = req.user.id

    const review = art.$relatedQuery("reviews").insert(req.body)

    res.status(201).send(review)
  })
  .patch("/:artId", async (req, res) => {
    Art.filterPatch(req.body)

    let art = await req.user.$relatedQuery("arts").findById(req.params.artId)
    art = await art.$query().patch(req.body)

    res.send(art)
  })
  .post("/:artId/list", async (req, res) => {
    let art = await req.user.$relatedQuery("arts").findById(req.params.artId)
    assert(art.status == "not for sale", 405)

    art = await art.$query().patch({ status: "for sale" })

    res.send(art)
  })
  .delete("/:artId/list", async (req, res) => {
    let art = await req.user.$relatedQuery("arts").findById(req.params.artId)
    assert(art.status == "for sale", 405)

    art = await art.$query().patch({ status: "not for sale" })

    res.send(art)
  })
  .patch("/:artId/purchase", ensureHasPayment, async (req, res) => {
    let art = await Art.query()
      .findById(req.params.artId)
      .eager({ artist: true })

    assert(art.status == "for sale" && art.artist.stripeAccountId, 405)

    art = await transaction(Art.knex(), async trx =>
      art.purchase(
        req.user.id,
        req.user.stripeCustomerId,
        req.body.source,
        art.artist.stripeAccountId,
        trx
      )
    )

    res.send(art)
  })
  .delete("/:artId", async (req, res) => {
    const art = await req.user.$relatedQuery("arts").findById(req.params.artId)
    await art.$query().delete()

    res.sendStatus(204)
  })
  .delete("/:artId/favorites", async (req, res) => {
    const art = await Art.query().findById(req.params.artId)
    await art
      .$relatedQuery("favoriteUsers")
      .unrelate()
      .where("user_id", req.user.id)

    res.sendStatus(204)
  })
