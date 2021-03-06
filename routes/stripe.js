const { Router } = require("express")
const axios = require("axios").default
const assert = require("http-assert")
const stripe = require("../lib/stripe")
const { ensureIsVerified, ensureHasPayment } = require("../lib/middlewares")
const pick = require("lodash/pick")
const debug = require("debug")("bazaar:stripe")
const { clearTokens } = require("../lib/token")

module.exports = Router()
  .use(ensureIsVerified)
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

    req.user = await req.user
      .$query()
      .patch({ stripeAccountId: data.stripe_user_id })

    res.status(201).send(await clearTokens(req.user))
  })
  .post("/customers", async (req, res) => {
    // require a source because we don't really need to create a stripe customer
    // unless they want to integrate a payment source (e.g. card)
    assert(req.body.stripeToken, 401)

    debug("STRIPE TOKEN: %o", req.body.stripeToken)

    const customer = await stripe.customers.create({
      email: req.user.email,
      source: req.body.stripeToken
    })

    req.user = await req.user.$query().patch({ stripeCustomerId: customer.id })

    res.status(201).send(await clearTokens(req.user))
  })
  .get("/sources", ensureHasPayment, async (req, res) => {
    const customer = await stripe.customers.retrieve(req.user.stripeCustomerId)

    debug("RETRIEVING CUSTOMER %o", customer)

    // TODO: paginate the sources if has_more is true
    const sources = customer.sources.data.map(source =>
      pick(source, ["id", "created", "bank_name", "country", "last4", "brand"])
    )

    res.send(sources)
  })
