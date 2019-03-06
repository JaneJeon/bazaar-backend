const { agent } = require("supertest")
const app = require("../../app")
const request = agent(app)
const redis = require("../../lib/redis")

describe("art routes", () => {
  let arts

  describe("GET /arts", () => {
    it.skip("should fetch some arts", async () => {
      const res = await request.get("/arts").expect(200)

      arts = res.body
    })
  })

  describe("GET /arts/:artId", () => {
    it.skip("should fetch a specific art", async () => {
      await request.get(`/arts/${arts[0].id}`).expect(200)
    })
  })

  describe("GET /users/:userId/arts", () => {
    it.skip("should list arts by a user", async () => {
      await request.get(`/users/${text.slugify(user.username)}/arts`)
    })
  })

  describe("POST /arts", async () => {
    const pictures = await redis.smembers("pictures")

    context("when unauthenticated or not verified", () => {
      it.skip("should reject", async () => {
        await request
          .post("/arts")
          .field("title", "hello")
          .field("description", "blah blah #foo @bar")
          .attach("pictures", pictures[0])
          .attach("pictures", pictures[1])
          .expect(401)
      })
    })

    context("when user is verified", () => {
      it.skip("should create art", async () => {
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
})
