const assert = require("http-assert")

exports.convertToZeroDecimal = (price, priceUnit) => {
  let result = price

  switch (priceUnit) {
    case "usd":
      result *= 100
      break
    default:
      assert(false, 400, "Currency not supported!")
  }

  return result
}
