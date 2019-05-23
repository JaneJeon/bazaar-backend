const request = require("supertest")(require("../../app"))
const { users } = require("./tokens")

describe.skip("reviews routes", () => {
  let arts, art, commissions

  before(async () => {
    const res = await request.get("/arts").expect(200)
    arts = res.body
  })

  beforeEach(async () => {
    await request.post("/sessions").send(users[0])
  })

  describe("GET /users/:userId/reviews", () => {
    it("should list reviews about a user", async () => {
      await request
        .get(`/users/${users[0].username.toLowerCase()}/reviews`)
        .expect(200)
    })

    it("should list reviews by a user", async () => {
      await request
        .get(`/users/${users[0].username.toLowerCase()}/reviews?as=reviewer`)
        .expect(200)
    })
  })

  describe("POST /arts/:artId/reviews", () => {
    it("should successfully post a review about the artist", async () => {
      await request
        .post(`/arts/${arts[0].id}/reviews`)
        .send({ description: "He was nice", rating: 4 })
        .expect(201)
    })
  })

  describe("PATCH /arts/:artId/reviews", () => {
    it("should successfully edit a review about the artist", async () => {
      await request
        .patch(`/arts/${arts[0].id}/reviews`)
        .send({ description: "changed!" })
        .expect(204)
    })
  })

  describe("DELETE /arts/:artId/reviews", () => {
    it("should successfully delete a review about the artist", async () => {
      await request.delete(`/arts/${arts[0].id}/reviews?as=buyer`).expect(204)
    })
  })
})
