module.exports.list = function(val) {
  return val.split(/\s*,\s*/g).filter(Boolean)
}

module.exports.size = function(val) {
  var match = /^(\d+)x(\d+)$/.exec(val)
  return match ? [+match[1], +match[2]] : undefined
}

module.exports.range = function(from, to) {
  var items = []
    , i
  for (i = from; i <= to; ++i) {
    items.push(i)
  }
  return items
}
