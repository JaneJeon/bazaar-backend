const rateLimit = require("express-rate-limit")
const RedisStore = require("rate-limit-redis")
const client = require("../lib/redis")

module.exports = rateLimit({ store: new RedisStore({ client }) })
