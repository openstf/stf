var readline = require('readline')

var zmq = require('zmq')
var Promise = require('bluebird')

var logger = require('../util/logger')
var tx = require('../util/tx')
var wire = require('../wire')
var wireutil = require('../wire/util')

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

  var clients = []
    , group = wireutil.global

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
      case 'invite':
        if (clients.length) {
          log.error('We already have clients')
          break
        }

        var ours = group = wireutil.makePrivateChannel()

        var messageListener = function(theirs, data) {
          if (theirs.toString() === ours) {
            var wrapper = wire.Envelope.decode(data)
            switch (wrapper.type) {
              case wire.MessageType.JOIN_GROUP:
                var message = wire.JoinGroupMessage.decode(wrapper.message)
                clients.push(message.serial)
                log.info('"%s" joined', message.serial)
                break
              case wire.MessageType.LEAVE_GROUP:
                var message = wire.LeaveGroupMessage.decode(wrapper.message)
                  , index = clients.indexOf(message.serial)
                clients.splice(index, 1)
                log.info('"%s" left', message.serial)
                break
              default:
                throw new Error('Unexpected response')
            }
          }
        }

        sub.subscribe(ours)
        sub.on('message', messageListener)

        push.send([wireutil.global, wireutil.makeGroupMessage(
          ours
        , 10000
        , []
        )])

        Promise.delay(1000)
          .then(function() {
            rl.prompt()
          })
        break
      case 'shell':
        var resolvers = {}
          , ours = wireutil.makePrivateChannel()
          , counter = 0

        log.debug('Using channel "%s"', ours)

        clients.forEach(function(client) {
          resolvers[client] = Promise.defer()
        })

        var messageListener = function(theirs, data) {
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
                resolvers[message.serial].resolve()
                break
              case wire.MessageType.DEVICE_FAIL:
                var message = wire.DeviceFailMessage.decode(wrapper.message)
                log.error('[%s] FAIL: ', message.serial, message.reason)
                resolvers[message.serial].reject(new Error(message.reason))
                break
              default:
                throw new Error('Unexpected response')
            }
          }
        }


        sub.subscribe(ours)
        sub.on('message', messageListener)

        push.send([group, wireutil.makeShellCommandMessage(
          ours
        , args
        )])

        var promises = Object.keys(resolvers).map(function(serial) {
          return resolvers[serial].promise
        })

        Promise.settle(promises)
          .then(function() {
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
