const request = require("supertest")(require("../../app"))
const { users } = require("./tokens")
const redis = require("../../lib/redis")

describe("favorites routes", () => {
  let arts, token

  before(async () => {
    pictures = await redis.smembers("pictures")

    const response = await request.get("/arts").expect(200)
    arts = response.body

    const res = await request.post("/tokens").send(users[0])
    token = res.body
  })

  describe("GET /users/:userId/favorites", () => {
    it("should list favorites by a user", async () => {
      await request
        .get(`/users/${users[0].username.toLowerCase()}/favorites`)
        .expect(200)
    })

    it("should 404 when user is not found", async () => {
      await request.get("/users/1234/arts").expect(404)
    })
  })

  describe("GET /arts/:artId/favorites", () => {
    it("should list favorites by an art", async () =>
      await request.get(`/arts/${arts[0].id}/favorites`).expect(200))
  })

  describe("POST /arts/:artId/favorites", () => {
    context("when unauthenticated or not verified", () => {
      it("should reject", async () => {
        await request.delete("/sessions")

        await request.post(`/arts/${arts[0].id}/favorites`).expect(401)
      })

      context("when user is verified", () => {
        it("should like art", async () => {
          const res = await request
            .post(`/arts/${arts[0].id}/favorites`)
            .set("Authorization", "Bearer " + token)
            .expect(201)
        })
      })
    })
  })

  describe("DELETE /arts/:artId/favorites", () => {
    context("when unauthenticated or not verified", () => {
      it("should reject", async () => {
        await request.delete("/sessions")

        await request.delete(`/arts/${arts[0].id}/favorites`).expect(401)
      })

      context("when user is verified", () => {
        it("should remove favorite", async () => {
          const res = await request
            .delete(`/arts/${arts[0].id}/favorites`)
            .set("Authorization", "Bearer " + token)
            .expect(204)
        })
      })
    })
  })
})
