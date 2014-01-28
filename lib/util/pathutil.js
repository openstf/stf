var path = require('path')

// Export
module.exports.resource = function(target) {
  return path.resolve(__dirname, '../../res', target)
}

// Export
module.exports.vendor = function(target) {
  return path.resolve(__dirname, '../../vendor', target)
}
