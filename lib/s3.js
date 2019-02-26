const S3 = require("aws-sdk/clients/s3")
const awsConfig = require("../config/aws")

module.exports = new S3(awsConfig)
