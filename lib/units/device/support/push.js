var syrup = require('stf-syrup')

var zmq = require('zmq')
var Promise = require('bluebird')

var logger = require('../../../util/logger')
var srv = require('../../../util/srv')

module.exports = syrup.serial()
  .define(function(options) {
    var log = logger.createLogger('device:support:push')

    // Output
    var push = zmq.socket('push')

    return Promise.map(options.endpoints.push, function(endpoint) {
        return srv.resolve(endpoint).then(function(records) {
          return srv.attempt(records, function(record) {
            log.info('Sending output to "%s"', record.url)
            push.connect(record.url)
            return Promise.resolve(true)
          })
        })
      })
      .return(push)
  })
