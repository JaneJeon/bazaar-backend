const sharp = require("sharp")
const s3 = require("./s3")
const { promisify } = require("util")
const { randomBytes: randomBytesCB } = require("crypto")
const randomBytes = promisify(randomBytesCB)

exports.processAndUpload = async buf => {
  const image = await sharp(buf)
    .resize(process.env.IMAGE_MAX_WIDTH, process.env.IMAGE_MAX_HEIGHT, {
      withoutEnlargement: true,
      fit: "inside"
    })
    .jpeg({ quality: 90 })
    .toBuffer()
  return s3
    .upload({
      Key: randomBytes(16).toString("hex") + ".jpeg",
      Body: image,
      Bucket: process.env.PICTURE_BUCKET,
      ACL: "public-read"
    })
    .promise()
}

exports.del = async Key =>
  s3.deleteObject({ Key, Bucket: process.env.PICTURE_BUCKET }).promise()
