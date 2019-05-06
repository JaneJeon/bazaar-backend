const BaseModel = require("./base")

class Report extends BaseModel {
  static get idColumn() {
    return ["transaction_id", "reporter_id"]
  }

  static get jsonSchema() {
    return {
      type: "object",
      properties: {
        transactionId: { type: "string" },
        details: { type: "string", maxLength: process.env.MAX_REPORT_LENGTH }
      },
      required: [],
      additionalProperties: false
    }
  }
}

module.exports = Report
