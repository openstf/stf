var path = require('path')

// Export
module.exports.resource = function(target) {
  return path.resolve(__dirname, '../../app', target)
}
