const { agent } = require("supertest")
const app = require("../../app")
const request = agent(app)
const { strictEqual, notStrictEqual } = require("assert")
const testUser = { username: "Ricky Cranium", password: "123456789" }
const redis = require("../../lib/redis")

exports.testUser = testUser

describe("user routes", () => {
  let user

  describe("POST /users", () => {
    it("should sign up", async () => {
      const res = await request
        .post("/users")
        .send(
          Object.assign({ email: "success@simulator.amazonses.com" }, testUser)
        )
        .expect(201)

      user = res.body
      strictEqual(user.verified, false)
    })

    it("should 400 when parameters are wrong", async () => {
      await request
        .post("/users")
        .send({ username: "hello", password: "123", email: "asdf@gmail.com" })
        .expect(400)
    })
  })

  describe("GET /users/:userId", () => {
    it("should return the user information", async () => {
      const res = await request.get(`/users/${user.id}`).expect(200)

      strictEqual(res.body.username, testUser.username)
      notStrictEqual(res.body.password, testUser.password)
    })

    it("should 404 when user is not found", async () => {
      await request.get("/users/999").expect(404)
    })
  })

  describe("PATCH /users/verify/:token", () => {
    let token
    before(async () => {
      const [key] = await redis.keys("verify:*")
      token = key.substr("verify:".length)
    })

    it("should verify user given the right token", async () => {
      await request.patch(`/users/verify/${token}`).expect(200)
    })

    it("should reject token doesn't match any user", async () => {
      await request.patch(`/users/verify/${token}1`).expect(404)
    })
  })
})
