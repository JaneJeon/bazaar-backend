const assert = require("assert")
const text = require("../../lib/text")
const isEqual = require("lodash/isEqual")

describe("text", () => {
  describe("#clean()", () => {
    it("should strip out whitespaces on both ends", () => {
      assert(text.clean("\thello world! ") === "hello world!")
    })

    it("should strip out redundant whitespaces", () => {
      assert(text.clean("hello  world!") === "hello world!")
      assert(text.clean("hello\n\n world!", false) === "hello\n world!")
    })
  })

  describe("#extractTags()", () => {
    it("should return lower-cased and stripped tags", () => {
      assert(
        isEqual(text.extractTags("#fOo #1 2 blah #_bar"), [
          "#foo",
          "#1",
          "#_bar"
        ])
      )
    })
  })

  describe("#slugify()", () => {
    it("should lowercase and replace spaces with underscores", () => {
      assert(text.slugify("Hello World") === "hello_world")
    })
  })
})
