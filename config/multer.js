const multer = require("multer")
const multerS3 = require("multer-s3")
const s3 = require("./s3")

// read https://github.com/badunk/multer-s3#readme
module.exports = multer({
  storage: multerS3({ s3, bucket: process.env.PICTURE_BUCKET })
})
