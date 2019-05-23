const request = require("supertest")(require("../../app"))
const { users } = require("./tokens")
const redis = require("../../lib/redis")
const assert = require("assert")

describe("art routes", () => {
  let arts, art, pictures, token

  before(async () => {
    pictures = await redis.smembers("pictures")

    const res = await request.post("/tokens").send(users[0])
    token = res.body
  })

  describe("GET /arts", () => {
    it("should fetch some arts", async () => {
      const res = await request.get("/arts").expect(200)

      arts = res.body
    })

    it.skip("should filter art by status", async () => {
      // TODO: for Ryan
    })
  })

  describe("GET /arts/:artId", () => {
    it("should fetch a specific art", async () => {
      await request.get(`/arts/${arts[0].id}`).expect(200)
    })
  })

  describe("GET /users/:userId/arts", () => {
    it("should list arts by a user", async () => {
      await request
        .get(`/users/${users[0].username.toLowerCase()}/arts`)
        .expect(200)
    })

    it.skip("should filter art by status", async () => {
      // TODO: for Ryan
    })

    it("should 404 when user is not found", async () => {
      await request.get("/users/1234/arts").expect(404)
    })
  })

  describe("POST /arts", async () => {
    context("when unauthenticated or not verified", () => {
      it("should reject", async () => {
        await request
          .post("/arts")
          .field("title", "hello")
          .attach("pictures", pictures[0])
          .attach("pictures", pictures[1])
          .expect(401)
      })
    })

    context("when user is verified", () => {
      it("should create art", async () => {
        const res = await request
          .post("/arts")
          .set("Authorization", "Bearer " + token)
          .field("title", "hello")
          .field("price", "42")
          .field("description", "blah blah #foo @bar")
          .attach("pictures", pictures[0])
          .attach("pictures", pictures[1])
          .expect(201)

        art = res.body

        assert(art.price === 42)
      })

      context("when the art has missing pictures upload", () => {
        it("should reject", async () => {
          await request
            .post("/arts")
            .set("Authorization", "Bearer " + token)
            .field("title", "hello")
            .expect(400)
        })
      })

      context("when the pictures are attached to the wrong field", () => {
        it("should reject", async () => {
          await request
            .post("/arts")
            .set("Authorization", "Bearer " + token)
            .field("title", "hello")
            .attach("picture", pictures[0])
            .expect(400)
        })
      })
    })
  })

  describe("PATCH /arts/:artId", () => {
    it("should update the art", async () => {
      await request
        .patch(`/arts/${arts[0].id}`)
        .set("Authorization", "Bearer " + token)
        .send({ description: "changed!" })
        .expect(200)
    })

    it("should not allow users to re-upload photos", async () => {
      await request
        .patch(`/arts/${arts[0].id}`)
        .set("Authorization", "Bearer " + token)
        .attach("pictures", pictures[3])
        .expect(400)
    })
  })

  describe("DELETE /arts/:artId", () => {
    context("when the art belongs to the user", () => {
      it("should delete the art", async () => {
        await request
          .delete(`/arts/${art.id}`)
          .set("Authorization", "Bearer " + token)
          .expect(204)
      })
    })

    context("when the art does not belong to the user", () => {
      it("should return 404", async () => {
        const res = await request.post("/tokens").send(users[1])
        const newToken = res.body

        await request
          .delete(`/arts/${arts[0].id}`)
          .set("Authorization", "Bearer " + newToken)
          .expect(404)
      })
    })
  })
})
