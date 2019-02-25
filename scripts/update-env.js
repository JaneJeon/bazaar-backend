const dotenv = require("dotenv")
const path = require("path")
const fs = require("fs")

const oldPath = path.join(path.dirname(__dirname), ".env")
const newPath = path.join(path.dirname(__dirname), ".env.example")

let oldFile = fs.readFileSync(oldPath).toString()
const newFile = fs.readFileSync(newPath).toString()

const oldEnv = dotenv.parse(oldFile)
const newEnv = dotenv.parse(newFile)

for (let [k, v] of Object.entries(newEnv))
  if (!oldEnv.hasOwnProperty(k)) {
    // if .env.example has a value but .env does not, append .env
    if (v) oldFile += `${k}=${v}\n`
    else console.error(`MISSING CONFIG ${k} IN .env!`)
  } else if (!oldEnv[k] && v)
    // if .env.example has a key but not a value, replace it
    oldFile = oldFile.replace(new RegExp(`^${k}=`, "m"), `${k}=${v}`)

fs.writeFileSync(oldPath, oldFile)
