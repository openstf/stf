var path = require('path')

// Export
module.exports.root = function(target) {
  return path.resolve(__dirname, '../..', target)
}

// Export
module.exports.resource = function(target) {
  return path.resolve(__dirname, '../../res', target)
}

// Export
module.exports.vendor = function(target) {
  return path.resolve(__dirname, '../../vendor', target)
}

// Export
module.exports.module = function(target) {
  return path.resolve(__dirname, '../../node_modules', target)
}
