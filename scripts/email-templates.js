const { join } = require("path")
require("dotenv").config({ path: join(__dirname, "..", ".env") })
const ses = require("../lib/ses")
const debug = require("debug")("email")
;(async () => {
  try {
    await ses
      .createTemplate({
        Template: {
          TemplateName: "verify",
          SubjectPart: "Verify your email address",
          // can also create HtmlPart
          TextPart:
            "You have recently signed up for an account with Bazaar.\n" +
            "To verify your email, click on the following link: {{url}}\n" +
            "(the link expires in 24 hours)"
        }
      })
      .promise()
  } catch (err) {
    debug(err)
  }

  try {
    await ses
      .createTemplate({
        Template: {
          TemplateName: "reset",
          SubjectPart: "Reset your password",
          TextPart:
            "You have requested a password request with Bazaar.\n" +
            "To reset your password, click on the following link: {{url}}\n" +
            "(the link expires in 24 hours)"
        }
      })
      .promise()
  } catch (err) {
    debug(err)
  }
})()
