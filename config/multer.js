const multer = require("multer")

module.exports = multer({
  dest: "/tmp",
  limits: { fileSize: process.env.IMAGE_MAX_FILESIZE }
})
