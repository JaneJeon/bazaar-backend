const { agent } = require("supertest")
const app = require("../../app")
const request = agent(app)
const { testUser } = require("./users")

exports.user = testUser

describe("session routes", () => {
  describe("POST /sessions", () => {
    it("should sign in", async () => {
      await request
        .post("/sessions")
        .send(testUser)
        .expect(201)
    })
  })

  describe("DELETE /sessions", () => {
    it("should sign out", async () => {
      await request.delete("/sessions").expect(204)
    })
  })
})
