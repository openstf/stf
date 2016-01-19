var url = require('url')

module.exports.addParams = function(originalUrl, params) {
  var parsed = url.parse(originalUrl, true)
  parsed.search = null
  // TODO: change to ES6 loop
  for (var key in params) {
    if (params.dict.hasOwnProperty(key)) {
      parsed.query[key] = params[key]
    }
  }
  return url.format(parsed)
}

module.exports.removeParam = function(originalUrl, param) {
  var parsed = url.parse(originalUrl, true)
  parsed.search = null
  delete parsed.query[param]
  return url.format(parsed)
}
