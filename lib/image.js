const sharp = require("sharp")
const s3 = require("./s3")
const { basename, extname } = require("path")

exports.upload = async (path, obj, fit) => {
  const width = process.env[`${obj}_MAX_WIDTH`] - 0
  const height = process.env[`${obj}_MAX_HEIGHT`] - 0

  const image = await sharp(path)
    .resize(width, height, { withoutEnlargement: true, fit })
    .jpeg({ quality: 90 })
    .toBuffer()

  const file = await s3
    .upload({
      Key: `${basename(path, extname(path))}.jpeg`,
      Body: image,
      Bucket: process.env.PICTURE_BUCKET,
      ACL: "public-read"
    })
    .promise()

  return file.Location
}
