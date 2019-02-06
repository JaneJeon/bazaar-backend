const { Router } = require("express")
const { User } = require("../models")
const ses = require("../config/ses")
const jwt = require("jsonwebtoken")
const assert = require("http-assert")

module.exports = Router()
  // CREATE user - i.e. sign up
  .post("/", async (req, res) => {
    const { username, email, password } = req.body
    const user = await User.query().insert({ username, email, password })
    req.login(user, () => res.status(201).send({ user: req.user }))

    // email verification
    const token = jwt.sign({ id: user.id }, process.env.JWT_SECRET, {
      expiresIn: "24h"
    })
    await ses.sendTemplatedEmail({
      Source: process.env.SENDER_ADDRESS,
      Template: "verify",
      Destination: { ToAddresses: [user.email] },
      TemplateData: {
        url: `${
          process.env.FRONTEND_URL
        }/users/verify?token=${encodeURIComponent(token)}`
      }
    })
  })
  // verify user email
  .patch("/verify", async (req, res) => {
    assert(req.body.token, 400)
    const { id } = jwt.verify(req.body.token, process.env.JWT_SECRET)
    assert(req.user.id, 401)
    assert(id == req.user.id, 403)
    const user = await User.query().patchAndFetchById(id, { verified: true })
    res.send({ user })
  })
