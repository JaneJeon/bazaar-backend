const redis = require("../lib/redis")
const { sync: uid } = require("uid-safe")

exports.generate = async (prefix, key, value = 1, expire = 86400) => {
  const token = `${key}:${uid(24)}`
  await redis.setex(`${prefix}:${token}`, expire, value)

  return token
}

exports.fetch = async (prefix, token) => redis.get(`${prefix}:${token}`)

exports.consume = (prefix, key) =>
  new Promise(resolve => {
    const stream = redis.scanStream({ match: `${prefix}:${key}:*` })
    stream.on("data", tokens => {
      if (tokens.length) {
        stream.pause()
        redis.unlink(tokens).then(() => stream.resume())
      }
    })
    stream.on("end", resolve)
  })
