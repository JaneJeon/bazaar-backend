const assert = require("assert")
const text = require("../../lib/text")

describe("text", () => {
  describe("#clean()", () => {
    it("should strip out whitespaces on both ends", () => {
      assert(text.clean("\thello world! ") == "hello world!")
    })

    it("should strip out redundant whitespaces", () => {
      assert(text.clean("hello  world!") == "hello world!")
      assert(text.clean("hello\n\n world!", false) == "hello\n world!")
    })
  })

  describe("#extractTags()", () => {
    it("should return lower-cased and stripped tags", () => {
      assert.deepStrictEqual(text.extractTags("#fOo #1 2 blah #_bar"), [
        "#foo",
        "#1",
        "#_bar"
      ])
    })

    it("should return empty array when there's no tags", () => {
      assert.deepStrictEqual(text.extractTags("no tags here"), [])
    })
  })
})
