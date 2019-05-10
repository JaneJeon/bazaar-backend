const { Router } = require("express")
const axios = require("axios").default
const assert = require("http-assert")
const stripe = require("../lib/stripe")
const middlewares = require("../lib/middlewares")
const pick = require("lodash/pick")

module.exports = Router()
  // endpoint for artists to start getting paid
  .post("/accounts", async (req, res) => {
    // using axios instead of stripe since stripe SDK only creates custom accounts
    const { data } = await axios.post(
      "https://connect.stripe.com/oauth/token",
      {
        grant_type: "authorization_code",
        client_id: process.env.STRIPE_CLIENT_ID,
        client_secret: process.env.STRIPE_PRIVATE_KEY,
        "assert_capabilities[]": "card_payments",
        code: req.query.code
      }
    )

    await req.user.$query().patch({ stripeAccountId: data.stripe_user_id })

    res.status(201).send(req.user.stripeCopy)
  })
  .post("/customers", async (req, res) => {
    // require a source because we don't really need to create a stripe customer
    // unless they want to integrate a payment source (e.g. card)
    assert(req.body.stripeToken, 401)

    const customer = await stripe.customers.create({
      email: req.user.email,
      source: req.body.stripeToken
    })

    await req.user.$query().patch({ stripeCustomerId: customer.id })

    res.status(201).send(req.user.stripeCopy)
  })
  .get("/sources", middlewares.ensureHasPayment, async (req, res) => {
    const customer = await stripe.customers.retrieve(req.user.stripeCustomerId)

    // TODO: paginate the sources if has_more is true
    const sources = pick(customer.sources.data, [
      "id",
      "created",
      "bank_name",
      "country",
      "last4",
      "brand"
    ])

    res.send(sources)
  })
