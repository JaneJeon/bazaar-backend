const Bull = require("bull")

module.exports = new Bull("queue", process.env.REDIS_URL)
