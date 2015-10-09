var syrup = require('stf-syrup')

var Promise = require('bluebird')

var logger = require('../../../util/logger')
var srv = require('../../../util/srv')
var zmqutil = require('../../../util/zmqutil')

module.exports = syrup.serial()
  .define(function(options) {
    var log = logger.createLogger('device:support:push')

    // Output
    var push = zmqutil.socket('push')

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
