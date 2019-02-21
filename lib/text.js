exports.clean = (str, oneline = true) => {
  if (oneline) return str.trim().replace(/\s+/, " ")
  else return str.trim().replace(/\n+/, "\n")
}

exports.extractTags = str => str.match(/#\w+/g).map(str => str.toLowerCase())

exports.extractMentions = str =>
  str.match(/@\w+/g).map(str => str.toLowerCase())
