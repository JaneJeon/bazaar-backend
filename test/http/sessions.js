const { user } = require("./users")
const request = require("supertest-session")
const app = require("../../app")
const session = request(app)

describe("session routes", () => {
  describe("POST /sessions", () => {
    it("should sign in", done => {
      session
        .post("/sessions")
        .send(user)
        .expect(201, done)
    })
  })

  describe("DELETE /sessions", () => {
    it("should sign out", done => {
      session.delete("/sessions").expect(204, done)
    })
  })
})
