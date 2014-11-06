var syrup = require('stf-syrup')

var wirerouter = require('../../../wire/router')

module.exports = syrup.serial()
  .dependency(require('./sub'))
  .dependency(require('./channels'))
  .define(function(options, sub, channels) {
    var router = wirerouter()

    sub.on('message', router.handler())

    // Special case, we're hooking into a message that's not actually routed.
    router.on({$code: 'message'}, function(channel) {
      channels.keepalive(channel)
    })

    return router
  })
