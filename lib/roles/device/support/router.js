var syrup = require('syrup')

var logger = require('../../../util/logger')
var wirerouter = require('../../../wire/router')

module.exports = syrup.serial()
  .dependency(require('./sub'))
  .dependency(require('./channels'))
  .define(function(options, sub, channels) {
    var log = logger.createLogger('device:support:router')
    var router = wirerouter()

    sub.on('message', router.handler())

    router.on('message', function(channel) {
      channels.keepalive(channel)
    })

    return router
  })
