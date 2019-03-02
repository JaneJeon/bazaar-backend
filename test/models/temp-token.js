const assert = require("assert")
const tempToken = require("../../models/temp-token")

describe("tokens", () => {
  let token

  describe("#generate()", () => {
    it("should generate a token and store the value", async () => {
      token = await tempToken.generate("prefix", "key", "value")
      await tempToken.generate("prefix", "key", "value2")
    })
  })

  describe("#fetch()", () => {
    it("should fetch the value for the matching token", async () => {
      assert("value" == (await tempToken.fetch("prefix", token)))
    })
  })

  describe("#consume()", () => {
    it("should delete all values in the matching key space", async () => {
      await tempToken.consume("prefix", "key")
      assert(!(await tempToken.fetch("prefix", token)))
    })
  })
})
