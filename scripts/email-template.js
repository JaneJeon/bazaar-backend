const { join } = require("path")
require("dotenv").config({ path: join(__dirname, "..", ".env") })
const email = require("../config/ses")

email
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
  .then(console.log)
  .catch(console.error)
