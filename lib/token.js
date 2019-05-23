const redis = require("./redis")
const jwt = require("jsonwebtoken")

exports.addToken = async user => {
  const token = user.JWT

  await redis.sadd(`tokens:${token.id}`, token.jwtid)

  return jwt.sign(token, process.env.JWT_SECRET)
}

exports.checkToken = async token => {
  return redis.sismember(`tokens:${token.id}`, token.jwtid)
}

exports.removeToken = async token => {
  await redis.srem(`tokens:${token.id}`, token.jwtid)
}

exports.clearTokens = async (user, regenerate = true) => {
  await redis.del(`tokens:${user.id}`)
  if (regenerate) return this.addToken(user)
}
