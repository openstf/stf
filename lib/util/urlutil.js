var url = require('url')

/* eslint guard-for-in:0 */
module.exports.addParams = function(originalUrl, params) {
  var parsed = url.parse(originalUrl, true)
  parsed.search = null
  // TODO: change to ES6 loop
  for (var key in params) {
    parsed.query[key] = params[key]
  }
  return url.format(parsed)
}

module.exports.removeParam = function(originalUrl, param) {
  var parsed = url.parse(originalUrl, true)
  parsed.search = null
  delete parsed.query[param]
  return url.format(parsed)
}
