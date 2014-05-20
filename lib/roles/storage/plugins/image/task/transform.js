var gm = require('gm')
var Promise = require('bluebird')

module.exports = function(stream, options) {
  return new Promise(function(resolve, reject) {
    var transform = gm(stream)

    if (options.gravity) {
      transform.gravity(options.gravity)
    }

    if (options.crop) {
      transform.geometry(options.crop.width, options.crop.height, '^')
      transform.crop(options.crop.width, options.crop.height, 0, 0)
    }

    transform.stream(function(err, stdout) {
      if (err) {
        reject(err)
      }
      else {
        resolve(stdout)
      }
    })
  })
}
