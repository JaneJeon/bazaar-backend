require("../lib/text")

const session = require("supertest-session")
const app = require("../../app")
const request = session(app)
const assert = require("assert")
const tempToken = require("../../lib/temp-token")
const { User } = require("../../models")

describe("user routes", () => {
  const testUser = {
    username: "Ricky_Cranium",
    password: "123456789",
    email: "success@simulator.amazonses.com"
  }

  describe("POST /users", () => {
    it("should sign up", async () => {
      const res = await request
        .post("/users")
        .send(testUser)
        .expect(201)

      assert(res.body.verified === false)
      assert(res.body.avatar !== null)
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
      const res = await request
        .get(`/users/${testUser.username.toLowerCase()}`)
        .expect(200)

      assert(res.body.username == testUser.username)
      assert(res.body.password != testUser.password)
    })

    it("should 404 when user is not found", async () => {
      await request.get("/users/999").expect(404)
    })
  })

  describe("PATCH /users/verify/:token", () => {
    let token

    before(async () => {
      token = await tempToken.findOne("verify")
    })

    it("should verify user given the right token", async () => {
      await request.patch(`/users/verify/${token}`).expect(200)
    })

    it("should reject token doesn't match any user", async () => {
      await request.patch(`/users/verify/${token}1`).expect(404)
    })

    it("should not allow a token to be used twice", async () => {
      const result = await tempToken.fetch("verify", token)

      assert(result === null)
    })
  })

  describe("POST /users/reset", () => {
    it("should send password reset email", async () => {
      await request
        .post("/users/reset")
        .send({ email: testUser.email })
        .expect(200)

      const token = await tempToken.findOne("reset")

      assert(token)
    })
  })

  describe("PATCH /users/reset/:token", () => {
    let token

    before(async () => {
      token = await tempToken.findOne("reset")
    })

    it("should reset password given the right token", async () => {
      await request
        .patch(`/users/reset/${token}`)
        .send({ password: "987654321" })
        .expect(200)
    })

    it("should reject token doesn't match any user", async () => {
      await request.patch(`/users/reset/${token}1`).expect(404)
    })

    it("should not allow a token to be used twice", async () => {
      const result = await tempToken.fetch("reset", token)

      assert(result === null)
    })
  })

  describe("PATCH /users", () => {
    it("should update user details when logged in", async () => {
      await request
        .patch("/users")
        .send({ bio: "Just some dude" })
        .expect(200)
    })

    it("should not allow users to update username", async () => {
      await request
        .patch("/users")
        .send({ username: "xXh4X0rzXx" })
        .expect(400)
    })
  })

  describe("DELETE /users", () => {
    it("should delete the user", async () => {
      await request.delete("/users").expect(204)

      const user = await User.query().findById(testUser.username.toLowerCase())
      assert(user.deleted === true)
    })
  })
})
