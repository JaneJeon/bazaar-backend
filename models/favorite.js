const BaseModel = require("./base")

class Favorite extends BaseModel {
  static get idColumn() {
    return ["user_id", "art_id"]
  }
}
