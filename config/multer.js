const multer = require("multer")
const storage = multer.memoryStorage()

module.exports = multer({
  storage,
  limits: { fileSize: process.env.IMAGE_MAX_FILESIZE }
})
