exports.clean = (str, oneline = true) => {
  if (oneline) return str.trim().replace(/\s+/, " ")
  else return str.trim().replace(/\n+/, "\n")
}
