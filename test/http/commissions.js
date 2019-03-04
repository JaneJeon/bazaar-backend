const { agent } = require("supertest")
const app = require("../../app")
const request = agent(app)
const { user } = require("./sessions")

describe("commission routes", () => {
  // todo
})
