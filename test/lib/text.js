const { strictEqual, deepStrictEqual } = require("assert")
const text = require("../../lib/text")

exports.text = text

describe("text", () => {
  describe("#clean()", () => {
    it("should strip out whitespaces on both ends", () => {
      strictEqual(text.clean("\thello world! "), "hello world!")
    })

    it("should strip out redundant whitespaces", () => {
      strictEqual(text.clean("hello  world!"), "hello world!")
      strictEqual(text.clean("hello\n\n world!", false), "hello\n world!")
    })
  })

  describe("#extractTags()", () => {
    it("should return lower-cased and stripped tags", () => {
      deepStrictEqual(text.extractTags("#fOo #1 2 blah #_bar"), [
        "#foo",
        "#1",
        "#_bar"
      ])
    })
  })

  describe("#slugify()", () => {
    it("should lowercase and replace spaces with underscores", () => {
      strictEqual(text.slugify("Hello World"), "hello_world")
    })
  })
})
