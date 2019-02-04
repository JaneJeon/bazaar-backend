const SES = require("aws-sdk/clients/ses")
const awsConfig = require("./aws")

module.exports = new SES(awsConfig)
