const session = require("supertest-session")
const app = require("../../app")
const request = session(app)
const { users } = require("../../seeds/0-users")
const pick = require("lodash/pick")

exports.users = users

describe("session routes", () => {
  describe("POST /sessions", () => {
    it.skip("should sign in", async () => {
      await request
        .post("/sessions")
        .send(pick(users[0], ["username", "password"]))
        .expect(201)
    })

    it("should 401 when user doesn't exist", async () => {
      await request
        .post("/sessions")
        .send({ username: "asdfjkl", password: "123456789" })
        .expect(401)
    })

    it("should 401 when password is wrong", async () => {
      await request
        .post("/sessions")
        .send({ username: users[0].password, password: "123456789" })
        .expect(401)
    })
  })

  describe("DELETE /sessions", () => {
    it("should sign out", async () => {
      await request.delete("/sessions").expect(204)
    })
  })
})
