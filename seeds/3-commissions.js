const { User } = require("../models")

exports.seed = async () => {
  const [buyer, artist] = await User.query()

  // doing just one because I'm lazy
  await buyer.$relatedQuery("commissionsAsBuyer").insert([
    {
      artistId: artist.id,
      price: 42,
      deadline: "2019-03-05",
      numUpdates: 2,
      copyright: "buyer owns the right",
      description: "hello #test1 @test2"
    },
    {
      price: 39,
      deadline: "2019-09-01",
      copyright: "buyer owns the right",
      description: "#YOLO @foo"
    }
  ])
}
