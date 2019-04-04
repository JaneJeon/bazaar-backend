const stripe = require("stripe")(process.env.STRIPE_PRIVATE_KEY)
const { stringify } = require("querystring")
const { sync: uid } = require("uid-safe")

// step uno
exports.authorize = req => {
  req.session.state = uid(16)

  return `https://connect.stripe.com/express/oauth/authorize?${stringify({
    state: req.session.state,
    client_id: process.env.STRIPE_CLIENT_ID,
    "stripe_user[business_type]": "individual",
    "stripe_user[email]": req.user.email,
    "suggested_capabilities[]": "card_payments"
  })}`
}

// step dos is handled by stripe
// step tres
axios.post("https://connect.stripe.com/oauth/token")
