var syrup = require('stf-syrup')

var wirerouter = require('../../../wire/router')

module.exports = syrup.serial()
  .dependency(require('./sub'))
  .define(function(options, sub) {

    sub.on('message', router.handler())

    return router
  })
