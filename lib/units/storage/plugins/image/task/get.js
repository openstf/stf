var util = require('util')
var http = require('http')
var url = require('url')

var Promise = require('bluebird')

module.exports = function(path, options) {
  return new Promise(function(resolve, reject) {
    http.get(url.resolve(options.storageUrl, path))
      .on('response', function(res) {
        if (res.statusCode !== 200) {
          reject(new Error(util.format('HTTP %d', res.statusCode)))
        }
        else {
          resolve(res)
        }
      })
      .on('error', reject)
  })
}
