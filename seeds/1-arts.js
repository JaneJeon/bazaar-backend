const n = 4
const { sync: uid } = require("uid-safe")
const axios = require("axios")
const fs = require("fs")
const redis = require("../lib/redis")
const { User } = require("../models")
const faker = require("faker")

exports.seed = async () => {
  // save pictures
  let promises = []
  const paths = []

  for (let i = 0; i < n; i++) {
    const path = `/tmp/${uid(16)}.jpeg`
    paths.push(path)

    const response = await axios({
      url: faker.random.image(),
      method: "GET",
      responseType: "stream"
    })
    response.data.pipe(fs.createWriteStream(path))

    promises.push(
      new Promise((resolve, reject) => {
        response.data.on("end", resolve)
        response.data.on("error", reject)
      })
    )
  }

  await Promise.all(promises) // and they still feel oh so wasted on myself
  await redis.flushall()
  await redis.sadd("pictures", paths)
  promises = []

  // fetch a user, any user
  const user = await User.query().first()

  // insert picture models
  for (let i = 0; i < n / 2; i++) {
    promises.push(
      user.$relatedQuery("arts").insert({
        title: faker.random.words(5),
        description: `${faker.random.words(
          20
        )} #${faker.random.word()} #${faker.random.word()}`,
        price: faker.random.number(500) + 1,
        pictures: [paths[2 * i], paths[2 * i + 1]]
      })
    )
  }

  await Promise.all(promises)
}
