var syrup = require('syrup')

var wirerouter = require('../../../wire/router')

module.exports = syrup.serial()
  .dependency(require('./sub'))
  .dependency(require('./channels'))
  .define(function(options, sub, channels) {
    var router = wirerouter()

    sub.on('message', router.handler())

    router.on('message', function(channel) {
      channels.keepalive(channel)
    })

    return router
  })
