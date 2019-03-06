const { agent } = require("supertest")
const app = require("../../app")
const request = agent(app)

describe("session routes", () => {
  describe("POST /sessions", () => {
    it.skip("should sign in", async () => {
      await request
        .post("/sessions")
        .send(testUser)
        .expect(201)
    })
  })

  describe("DELETE /sessions", () => {
    it.skip("should sign out", async () => {
      await request.delete("/sessions").expect(204)
    })
  })
})
