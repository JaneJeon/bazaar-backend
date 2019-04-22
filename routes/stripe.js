const { Router } = require("express")
const axios = require("axios").default
const assert = require("http-assert")
const stripe = require("stripe")(process.env.STRIPE_PRIVATE_KEY)
const { Payment } = require("../models")
const { transaction } = require("objection")
const dayjs = require("dayjs")
const checkCommissionUpdateJob = require("../jobs/check-commission-update")

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

      const updates = []
      const now = dayjs()
      const days = dayjs(commission.deadline).diff(now, "day")

      for (let i = 0; i <= commission.numUpdates; i++) {
        const update = {
          updateNum: i,
          priceUnit: commission.priceUnit,
          deadline: dayjs()
            .add(Math.ceil((i * days) / commission.numUpdates), "day")
            .format("YYYY-MM-DD")
        }

        if (i == 0) {
          update.price =
            (commission.price * (1 - commission.numUpdates / 5)) / 2
          update.pictures = [""]
        } else if (i == commission.numUpdates - 1) {
          update.price = commission.price / 5
        } else {
          update.price =
            (commission.price * (1 - commission.numUpdates / 5)) / 2
        }

        updates.push(update)
      }

      await commission.$relatedQuery("updates", trx).insert(updates)

      await Promise.all(
        updates.map(update =>
          checkCommissionUpdateJob.add(
            // TODO: do I need to add "today"?
            { commissionId: commission.id, updateNum: update.updateNum },
            { delay: dayjs(update.deadline).diff(now) }
          )
        )
      )
    })

    res.sendStatus(201)
  })
