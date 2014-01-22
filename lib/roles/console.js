var readline = require('readline')

var zmq = require('zmq')
var Promise = require('bluebird')

var logger = require('../util/logger')
var tx = require('../util/tx')
var wire = require('../wire')
var wireutil = require('../util/wireutil')(wire)

module.exports = function(options) {
  var log = logger.createLogger('console')

  // Input
  var sub = zmq.socket('sub')
  sub.subscribe('ALL')
  options.endpoints.sub.forEach(function(endpoint) {
    log.info('SUB connected to %s', endpoint)
    sub.connect(endpoint)
  })

  // Output
  var push = zmq.socket('push')
  options.endpoints.push.forEach(function(endpoint) {
    log.info('PUSH connected to %s', endpoint)
    push.connect(endpoint)
  })

  // User input
  var rl = readline.createInterface({
    input: process.stdin
  , output: process.stdout
  })
  rl.setPrompt('stf> ')
  rl.prompt()

  rl.on('line', function(line) {
    var args = line.trim().split(/\s+/g)
    switch (args.shift()) {
      case 'help':
        console.log()
        console.log('Available commands:')
        console.log()
        console.log('  help - show help')
        console.log()
        rl.prompt()
        break
      case 'shell':
        var resolver = Promise.defer()
          , ours = wireutil.makePrivateChannel()

        log.debug('Using channel "%s"', ours)

        function messageListener(theirs, data) {
          if (theirs.toString() === ours) {
            var wrapper = wire.Envelope.decode(data)
            switch (wrapper.type) {
              case wire.MessageType.DEVICE_DATA:
                var message = wire.DeviceDataMessage.decode(wrapper.message)
                log.info('[%s] DATA: %s'
                  , message.serial, message.data.toUTF8().trim())
                break
              case wire.MessageType.DEVICE_DONE:
                var message = wire.DeviceDoneMessage.decode(wrapper.message)
                log.info('[%s] DONE', message.serial)
                resolver.resolve() // @todo Wait till all devices have finished
                break
              case wire.MessageType.DEVICE_FAIL:
                var message = wire.DeviceFailMessage.decode(wrapper.message)
                log.error('[%s] FAIL: ', message.serial, message.reason)
                resolver.reject(new Error(message.reason))
                break
              default:
                resolver.reject(new Error('Unexpected response'))
                break
            }
          }
        }

        sub.subscribe(ours)
        sub.on('message', messageListener)

        push.send([wireutil.global, wireutil.makeShellCommandMessage(
          ours
        , args
        )])

        resolver.promise.finally(function() {
          sub.unsubscribe(ours)
          sub.removeListener('message', messageListener)
          rl.prompt()
        })
        break
      case 'exit':
      case 'quit':
        process.exit(0)
        break
      default:
        console.log('Unknown command')
        rl.prompt()
        break
    }
  })

}
