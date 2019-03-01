const Redis = require("ioredis")
const log = require("./log")

const defaultInstance = new Redis(process.env.REDIS_URL)
const subscriberInstance = new Redis(process.env.REDIS_URL)
subscriberInstance.subscribe("chats", err => {
  if (err) log.error(err)
})

module.exports = defaultInstance
module.exports.pub = defaultInstance
module.exports.sub = subscriberInstance
