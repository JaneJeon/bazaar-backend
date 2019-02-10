const multer = require("multer")
const supported = /jpeg|png|webp|tiff|gif|svg/

module.exports = multer({
  dest: "/tmp",
  limits: { fileSize: process.env.IMAGE_MAX_FILESIZE },
  fileFilter: (req, file, done) => {
    if (supported.test(file.mimetype)) done(null, true)
    else done(`Upload only supports ${supported} types`)
  }
})
