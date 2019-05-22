const redis = require("./redis")

exports.addToken = async user => {
  const token = user.JWT

  await redis.sadd(`tokens:${token.id}`, token.jwtid)

  return token
}

exports.checkToken = async token => {
  return redis.sismember(`tokens:${token.id}`, token.jwtid)
}

exports.removeToken = async token => {
  await redis.srem(`tokens:${token.id}`, token.jwtid)
}

exports.clearTokens = async (user, regenerate = true) => {
  const token = user.JWT

  await redis.del(`tokens:${token.id}`)
  if (regenerate) {
    await this.addToken(user, token)
    return token
  }
}
