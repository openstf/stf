var syrup = require('stf-syrup')

var Promise = require('bluebird')

var logger = require('../../../util/logger')
var wireutil = require('../../../wire/util')
var srv = require('../../../util/srv')
require('../../../util/lifecycle')
var zmqutil = require('../../../util/zmqutil')

module.exports = syrup.serial()
  .define(function(options) {
    var log = logger.createLogger('device:support:sub')

    // Input
    var sub = zmqutil.socket('sub')

    return Promise.map(options.endpoints.sub, function(endpoint) {
        return srv.resolve(endpoint).then(function(records) {
          return srv.attempt(records, function(record) {
            log.info('Receiving input from "%s"', record.url)
            sub.connect(record.url)
            return Promise.resolve(true)
          })
        })
      })
      .then(function() {
        // Establish always-on channels
        [wireutil.global].forEach(function(channel) {
          log.info('Subscribing to permanent channel "%s"', channel)
          sub.subscribe(channel)
        })
      })
      .return(sub)
  })
