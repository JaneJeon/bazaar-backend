const { User, Art, Review } = require("../models")
const faker = require("faker")

exports.seed = async () => {
  const users = await User.query()
  const arts = await Art.query()
  let firstUser = users[0]
  let secondUser = users[1]

  const review = await arts[0].$relatedQuery("reviews").insert({
    reviewerId: firstUser.id,
    revieweeId: secondUser.id,
    description: "dissappointing to work with",
    rating: 4
  })
}
