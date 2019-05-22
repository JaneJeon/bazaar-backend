const redis = require("./redis")

exports.blacklist = async token => {
  const now = Math.floor(Date.now() / 1000)

  if (token && token.exp && token.exp > now)
    await redis.psetex(`blacklist:${token.jwtid}`, token.exp - now)
}

exports.isBlacklisted = async token => redis.exists(`blacklist:${token.jwtid}`)
