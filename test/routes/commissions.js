const request = require("supertest")(require("../../app"))
const { users } = require("./sessions")

describe.skip("commission routes", () => {
  before(async () => {
    await request.post("/sessions").send(users[0])
  })

  describe("GET /commissions", () => {
    it("should return all open commissions")
  })

  describe("GET /commissions/:commissionId", () => {
    it("should fetch commission by id")
  })

  describe("GET /users/:userId/commissions", () => {
    it("should return a user's public commissions")
  })

  describe("GET /commissions/byMe", () => {
    it("should return commissions made by the user")
  })

  describe("GET /commissions/forMe", () => {
    it("should return commissions requesting the user")
  })

  describe("POST /commissions", () => {
    it("should create a commission")
  })

  describe("PATCH /commissions/:commissionId", () => {
    it("should allow the buyer to edit a commission")
  })

  describe("PATCH /commissions/:commissionId/reject", () => {
    it("should allow the artist to reject a commission requesting them")
  })

  describe("DELETE /commissions/:commissionId", () => {
    it("should allow the buyer to delete a commission")
  })
})
