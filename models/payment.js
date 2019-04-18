const BaseModel = require("./base")

class Payment extends BaseModel {
  static get jsonSchema() {
    return {
      type: "object",
      properties: {
        // TODO: attach "purchase" method to the user model as buyer
        artistId: { type: "string" },
        artId: { type: "integer" },
        commissionId: { type: "integer" },
        stripeChargeId: { type: "string" },
        price: { type: "integer" },
        priceUnit: { type: "string" }
      },
      required: ["artistId", "stripeChargeId", "price", "priceUnit"],
      additionalProperties: false
    }
  }

  static get relationMappings() {
    return {
      // TODO: add relations from user(A/B), art
    }
  }

  // TODO: check that either commission_id or art_id is set when creating
}

module.exports = Payment
