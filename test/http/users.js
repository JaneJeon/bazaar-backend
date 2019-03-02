const request = require("supertest-session")
const app = require("../../app")
const session = request(app)
const assert = require("assert")

describe("user routes", () => {
  let username = "Ricky Cranium"
  let password = "123456789"
  let user

  describe("POST /users", () => {
    it("should sign up", done => {
      session
        .post("/users")
        .send({ username, email: "success@simulator.amazonses.com", password })
        .expect(201)
        .end((err, res) => {
          if (err) return done(err)
          user = res.body
          assert(user.verified === false)
          done()
        })
    })
  })

  describe("GET /users/:userId", () => {
    it("should return the user information", done => {
      request(app)
        .get(`/users/${user.id}`)
        .expect(200)
        .end((err, res) => {
          if (err) return done(err)
          assert(res.body.username == username)
          assert(res.body.password != password)
          done()
        })
    })
  })
})
