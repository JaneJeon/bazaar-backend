const multer = require("multer")
const logger = require("./logger")

module.exports = multer({
  dest: "/tmp",
  limits: { fileSize: process.env.IMAGE_MAX_FILESIZE },
  fileFilter: (req, file, done) => {
    logger.info({ fileSizeBytes: file.size, userId: req.user.id })
    done(null, true)
  }
})
