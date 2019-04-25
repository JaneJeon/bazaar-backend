const algolia = require("algoliasearch")

module.exports = algolia(
  process.env.ALGOLIASEARCH_APPLICATION_ID,
  process.env.ALGOLIASEARCH_API_KEY
)
