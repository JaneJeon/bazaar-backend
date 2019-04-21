const { Router } = require("express")
const axios = require("axios").default
const assert = require("http-assert")
const stripe = require("stripe")(process.env.STRIPE_PRIVATE_KEY)
const { Payment } = require("../models")
const { transaction } = require("objection")

module.exports = Router()
  .use((req, res, next) => next(req.ensureVerified()))
  // endpoint for artists to start getting paid
  .post("/account", async (req, res) => {
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

    await req.user.$query().patch({ stripe_account_id: data.stripe_user_id })

    res.end()
  })
  .post("/customer", async (req, res) => {
    // require a source because we don't really need to create a stripe customer
    // unless they want to integrate a payment source (e.g. card)
    assert(req.body.stripeToken, 401)

    const customer = await stripe.customers.create({
      email: req.user.email,
      source: req.body.stripeToken
    })

    await req.user.$query().patch({ stripe_customer_id: customer.id })

    res.end()
  })
  // endpoint for buyer to actually start the commission
  .post("/commissions/:commissionId", async (req, res) => {
    await transaction(Payment.knex(), async trx => {
      const commission = await req.user
        .$relatedQuery("commissionsAsBuyer", trx)
        .where("commission_id", commissionId)
        .first()
        .throwIfNotFound()

      const charge = await stripe.charges.create({
        amount: commission.price,
        currency: commission.priceUnit,
        transfer_group: `commission-${commission.id}`,
        customer: req.user.stripeCustomerId
      })

      await Payment.query(trx).insert({
        buyerId: commission.buyerId,
        artistId: commission.artistId,
        commissionId: commission.id,
        price: commission.price,
        priceUnit: commission.priceUnit,
        stripeChargeId: charge.id
      })

      await commission.$query(trx).patch({ status: "in progress" })
    })

    res.sendStatus(201)
  })
