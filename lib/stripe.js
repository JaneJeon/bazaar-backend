const stripe = require("stripe")(process.env.STRIPE_PRIVATE_KEY)
const axios = require("axios").default

// Connect the new Stripe account to the platform account
exports.connectArtist = code =>
  axios.post("https://connect.stripe.com/oauth/token", {
    grant_type: "authorization_code",
    client_id: process.env.STRIPE_CLIENT_ID,
    client_secret: process.env.STRIPE_PRIVATE_KEY,
    "assert_capabilities[]": "card_payments",
    code
  })
