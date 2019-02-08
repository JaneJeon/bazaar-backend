const { randomBytes } = require("crypto")

exports.string = length =>
  new Promise((resolve, reject) => {
    randomBytes(length || 16, (err, buf) => {
      if (err) reject(err)
      resolve(buf.toString("hex"))
    })
  })
