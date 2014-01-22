var zmq = require('zmq')

var logger = require('../util/logger')
var wire = require('../wire')
var wireutil = require('../util/wireutil')(wire)

module.exports = function(options) {
  var log = logger.createLogger('coordinator')

  if (options.name) {
    logger.setGlobalIdentifier(options.name)
  }

  // App side
  var appDealer = zmq.socket('dealer')
  options.endpoints.appDealer.forEach(function(endpoint) {
    log.info('App dealer connected to %s', endpoint)
    appDealer.connect(endpoint)
  })

  appDealer.on('message', function(channel, id, cmd) {
    devDealer.send([].slice.call(arguments))
  })

  // Device side
  var devDealer = zmq.socket('dealer')
  options.endpoints.devDealer.forEach(function(endpoint) {
    log.info('Device dealer connected to %s', endpoint)
    devDealer.connect(endpoint)
  })

  devDealer.on('message', function(channel, data) {
    var wrapper = wire.Envelope.decode(data)
    switch (wrapper.type) {
      case wire.MessageType.DEVICE_POKE:
        var message = wire.DevicePokeMessage.decode(wrapper.message)
        devDealer.send([message.channel, wireutil.makeProbeMessage()])
        break
      case wire.MessageType.DEVICE_STATUS:
        var message = wire.DeviceStatusMessage.decode(wrapper.message)
        break
      case wire.MessageType.DEVICE_PROPERTIES:
        var message = wire.DevicePropertiesMessage.decode(wrapper.message)
        break
    }
  })
}
