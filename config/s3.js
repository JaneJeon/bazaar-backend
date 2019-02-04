const S3 = require("aws-sdk/clients/s3")
const awsConfig = require("./aws")

module.exports = new S3(awsConfig)
