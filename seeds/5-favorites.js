const { User, Art, Favorite} = require("../models")
const faker = require("faker")

exports.seed = async () => {
  const users = await User.query()
  const arts = await Art.query()
  firstUser = users[0];
  secondUser = users[1];

  const favorite = await arts[0]
    .$relatedQuery("favoriteUsers")
    .relate(firstUser.id)

  const secondFavorite = await arts[0]
    .$relatedQuery("favoriteUsers")
    .relate(secondUser.id)

    const thirdFavorite = await arts[1]
      .$relatedQuery("favoriteUsers")
      .relate(secondUser.id)

}
