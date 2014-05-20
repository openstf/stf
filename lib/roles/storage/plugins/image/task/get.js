var util = require('util')
var http = require('http')

var Promise = require('bluebird')

module.exports = function(id, options) {
  return new Promise(function(resolve, reject) {
    http.get(util.format('%sapi/v1/resources/%s', options.storageUrl, id))
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
