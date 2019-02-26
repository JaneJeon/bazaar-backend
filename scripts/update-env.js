const dotenv = require("dotenv")
const path = require("path")
const fs = require("fs")
const debug = require("debug")("env")

const oldPath = path.join(path.dirname(__dirname), ".env")
const newPath = path.join(path.dirname(__dirname), ".env.example")

let oldFile
const newFile = fs.readFileSync(newPath).toString()
try {
  oldFile = fs.readFileSync(oldPath).toString()
} catch (err) {
  debug(err)
  return fs.writeFileSync(oldPath, newFile)
}

const oldEnv = dotenv.parse(oldFile)
const newEnv = dotenv.parse(newFile)

for (let [k, v] of Object.entries(newEnv)) {
  debug(`[${k}] ex=${v}, env k=${oldEnv.hasOwnProperty(k)}, v=${oldEnv[k]}`)

  if (!oldEnv.hasOwnProperty(k)) {
    if (v) {
      // if .env.example has a value but .env does not, append .env
      debug(`Appending ${k}=${v}`)
      oldFile += `${k}=${v}\n`
    } else console.error(`MISSING CONFIG ${k} IN .env!`)
  } else if (!oldEnv[k] && v) {
    // if .env.example has a key but not a value, replace it
    debug(`Replacing ${k} from ${oldEnv[k]} to ${v}`)
    oldFile = oldFile.replace(new RegExp(`^${k}=`, "m"), `${k}=${v}`)
  }
}

fs.writeFileSync(oldPath, oldFile)
