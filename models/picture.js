const BaseModel = require("./base")
const sharp = require("sharp")
const s3 = require("../config/s3")
const MAX_WIDTH = process.env.IMAGE_MAX_WIDTH - 0
const MAX_HEIGHT = process.env.IMAGE_MAX_HEIGHT - 0

class Picture extends BaseModel {
  static get jsonSchema() {
    return {
      type: "object",
      properties: {
        title: {
          type: "string",
          minLength: 1,
          maxLength: process.env.MAX_TITLE_LENGTH
        },
        description: {
          type: "string",
          maxLength: process.env.MAX_DESCRIPTION_LENGTH
        },
        url: { type: "string" }
      },
      required: ["title", "url"],
      additionalProperties: false
    }
  }

  async $beforeInsert(queryContext) {
    await super.$beforeInsert(queryContext)

    const image = await sharp(this.url)
      .resize(MAX_WIDTH, MAX_HEIGHT, {
        withoutEnlargement: true,
        fit: "inside"
      })
      .jpeg({ quality: 90 })
      .toBuffer()

    const file = await s3
      .upload({
        Key: this.url.substr(5),
        Body: image,
        Bucket: process.env.PICTURE_BUCKET,
        ACL: "public-read"
      })
      .promise()

    this.url = file.Location
  }
}

module.exports = Picture
