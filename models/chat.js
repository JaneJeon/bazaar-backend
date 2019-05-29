const BaseModel = require("./base")

class Chat extends BaseModel {
  static get idColumn() {
    return ["commission_id", "artist_id", "dummy_field"]
  }

  static get jsonSchema() {
    return {
      type: "object",
      properties: {
        message: { type: "string", maxLength: process.env.MAX_CHAT_LENGTH }
      }
    }
  }

  static get hidden() {
    return ["dummyField"]
  }
}

module.exports = Chat
