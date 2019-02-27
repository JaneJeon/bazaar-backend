const rateLimit = require("express-rate-limit")
const RedisStore = require("rate-limit-redis")
const client = require("./redis")

module.exports = rateLimit({ store: new RedisStore({ client }) })
