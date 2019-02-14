const { join } = require("path")
require("dotenv").config({ path: join(__dirname, "..", ".env") })

const tableName = require("pluralize")("picture")
const n = Math.floor(process.env.PAGE_SIZE * 2.5)
const random = require("../lib/random")
const axios = require("axios")
const fs = require("fs")
const { Art } = require("../models")
const faker = require("faker")

exports.seed = async knex => {
  // obviously this is going to be different when users (and FK) are involved
  await knex(tableName).del()

  // save pictures
  let promises = []
  const paths = []

  for (let i = 0; i < n; i++) {
    const path = `/tmp/${await random.string()}.jpeg`
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
  promises = []

  // insert picture models
  for (let i = 0; i < n; i++) {
    promises.push(
      Art.query().insert({
        title: faker.random.words(5),
        description: faker.random.words(20),
        url: paths[i]
      })
    )
  }

  const users = await Promise.all(promises)
  console.log(users)
}
