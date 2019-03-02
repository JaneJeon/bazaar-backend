const { agent } = require("supertest")
const app = require("../../app")
const request = agent(app)
const { user } = require("./sessions")
const { text } = require("../lib/text")
const redis = require("../../lib/redis")

describe("art routes", () => {
  let arts

  describe("GET /arts", () => {
    it("should fetch some arts", async () => {
      const res = await request.get("/arts").expect(200)

      arts = res.body
    })
  })

  describe("GET /arts/:artId", () => {
    it("should fetch a specific art", async () => {
      await request.get(`/arts/${arts[0].id}`).expect(200)
    })
  })

  describe("GET /users/:userId/arts", () => {
    it("should list arts by a user", async () => {
      await request.get(`/users/${text.slugify(user.username)}/arts`)
    })
  })

  describe("POST /arts", async () => {
    const pictures = await redis.smembers("pictures")

    it("should reject users that aren't signed in or verified", async () => {
      await request
        .post("/arts")
        .field("title", "hello")
        .field("description", "blah blah #foo @bar")
        .attach("pictures", pictures[0])
        .attach("pictures", pictures[1])
        .expect(401)
    })

    it("should create art for verified users", async () => {
      await request.post("/sessions").send(user)

      await request
        .post("/arts")
        .field("title", "hello")
        .field("description", "blah blah #foo @bar")
        .attach("pictures", pictures[0])
        .attach("pictures", pictures[1])
        .expect(201)
    })
  })
})
