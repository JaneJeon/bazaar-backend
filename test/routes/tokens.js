const request = require("supertest")(require("../../app"))
const { users } = require("../../seeds/1-users")

exports.users = users

describe("token routes", () => {
  let token

  describe("POST /tokens", () => {
    it("should sign in", done => {
      request
        .post("/tokens")
        .send(users[0])
        .expect(201)
        .end((err, res) => {
          if (err) return done(err)
          token = res.body
          done()
        })
    })

    it("should 401 when user doesn't exist", async () => {
      await request
        .post("/tokens")
        .send({ username: "asdfjkl", password: "123456789" })
        .expect(401)
    })

    it("should 401 when password is wrong", async () => {
      await request
        .post("/tokens")
        .send({ username: users[0].password, password: "123456789" })
        .expect(401)
    })
  })

  describe("DELETE /tokens", () => {
    it("should sign out with a token", async () => {
      await request
        .delete("/tokens")
        .set("Authorization", "Bearer " + token)
        .expect(204)
    })

    it("should not error when there's no token", async () => {
      await request.delete("/tokens").expect(204)
    })
  })
})
