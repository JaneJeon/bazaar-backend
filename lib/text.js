exports.clean = (str, oneline = true) => {
  if (oneline) return str.trim().replace(/\s+/, " ")
  else return str.trim().replace(/\n+/, "\n")
}

exports.extractTags = str =>
  (str.match(/#\w+/g) || []).map(str => str.substr(1).toLowerCase())
