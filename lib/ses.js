const SES = require("aws-sdk/clients/ses")
const awsConfig = require("../config/aws")

module.exports = new SES(awsConfig)
