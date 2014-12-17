var syrup = require('stf-syrup')

var zmq = require('zmq')
var Promise = require('bluebird')

var logger = require('../../../util/logger')
var wireutil = require('../../../wire/util')
var srv = require('../../../util/srv')

module.exports = syrup.serial()
  .define(function(options) {
    var log = logger.createLogger('device:support:sub')

    // Input
    var sub = zmq.socket('sub')
    Promise.map(options.endpoints.sub, function(endpoint) {
      return srv.resolve(endpoint).then(function(records) {
        return srv.attempt(records, function(record) {
          log.info('Receiving input from "%s"', record.url)
          sub.connect(record.url)
          return Promise.resolve(true)
        })
      })
    })

    // Establish always-on channels
    ;[wireutil.global].forEach(function(channel) {
      log.info('Subscribing to permanent channel "%s"', channel)
      sub.subscribe(channel)
    })

    return sub
  })
