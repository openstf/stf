var assert = require('assert')
var util = require('util')

var Promise = require('bluebird')
var zmq = require('zmq')
var adbkit = require('adbkit')

var logger = require('../util/logger')
var wire = require('../wire')
var wireutil = require('../util/wireutil')(wire)
var devutil = require('../util/devutil')
var pathutil = require('../util/pathutil')
var promiseutil = require('../util/promiseutil')
var ChannelManager = require('../wire/channelmanager')

module.exports = function(options) {
  var log = logger.createLogger('device')
  var identity = Object.create(null)
  var vendor = Object.create(null)
  var solo = wireutil.makePrivateChannel()
  var channels = new ChannelManager()

  // Show serial number in logs
  logger.setGlobalIdentifier(options.serial)

  // Adb
  var adb = Promise.promisifyAll(adbkit.createClient())

  // Input
  var sub = zmq.socket('sub')
  options.endpoints.sub.forEach(function(endpoint) {
    log.info('Receiving input from %s', endpoint)
    sub.connect(endpoint)
  })

  // Establish always-on channels
  ;[wireutil.global, solo].forEach(function(channel) {
    log.info('Subscribing to permanent channel "%s"', channel)
    sub.subscribe(channel)
    channels.register(channel, Infinity)
  })

  // Unsubscribe from temporary channels when they timeout
  channels.on('timeout', function(channel) {
    log.info('Channel "%s" timed out', channel)
    sub.unsubscribe(channel)
    push.send([channel, wireutil.makeLeaveGroupMessage(options.serial)])
  })

  promiseutil.periodicNotify(adb.waitBootCompleteAsync(options.serial), 1000)
    .progressed(function() {
      log.info('Waiting for boot to complete')
    })
    .then(function() {
      log.info('Gathering properties')
      return adb.getPropertiesAsync(options.serial)
    })
    .then(function(properties) {
      log.info('Solving identity')
      return identity = devutil.makeIdentity(options.serial, properties)
    })
    .then(function() {
      vendor = devutil.vendorFiles(identity)
      return Promise.all(Object.keys(vendor).map(function(id) {
        var res = vendor[id]
        log.info(util.format('Pushing vendor file "%s"', res.dest))
        return adb.pushAsync(options.serial, res.src, res.dest, res.mode)
          .then(function(transfer) {
            return new Promise(function(resolve, reject) {
              transfer.on('end', resolve)
            })
          })
      }))
    })
    .done(function() {
      log.info('Ready for instructions')
      poke()
    })

  sub.on('message', function(channel, data) {
    var wrapper = wire.Envelope.decode(data)
    channels.keepalive(channel)
    switch (wrapper.type) {
      case wire.MessageType.PROBE:
        var message = wire.ProbeMessage.decode(wrapper.message)
        push.send([channel,
          wireutil.makeDeviceIdentityMessage(options.serial, identity)])
        break
      case wire.MessageType.GROUP:
        var message = wire.GroupMessage.decode(wrapper.message)
          , groupChannel = message.channel
        if (wireutil.matchesRequirements(identity, message.requirements)) {
          channels.register(groupChannel, message.timeout)
          log.info('Subscribing to group channel "%s"', groupChannel)
          sub.subscribe(groupChannel)
          push.send([groupChannel,
            wireutil.makeJoinGroupMessage(options.serial)])
        }
        break
      case wire.MessageType.SHELL_COMMAND:
        var message = wire.ShellCommandMessage.decode(wrapper.message)
        log.info('Running shell command "%s"', message.command.join(' '))
        adb.shellAsync(options.serial, message.command)
          .then(function(stream) {
            var resolver = Promise.defer()
              , seq = 0

            function dataListener(chunk) {
              push.send([message.channel,
                wireutil.makeDeviceDataMessage(
                  options.serial
                , seq++
                , chunk
                )])
            }

            function endListener() {
              push.send([message.channel,
                wireutil.makeDeviceDoneMessage(options.serial)])
              resolver.resolve()
            }

            function errorListener(err) {
              log.error('Shell command "%s" failed due to "%s"'
                , message.command.join(' '), err.message)
              resolver.reject(err)
              push.send([message.channel,
                wireutil.makeDeviceFailMessage(
                  options.serial
                , err.message
                )])
            }

            stream.on('data', dataListener)
            stream.on('end', endListener)
            stream.on('error', errorListener)

            return resolver.promise.finally(function() {
              stream.removeListener('data', dataListener)
              stream.removeListener('end', endListener)
              stream.removeListener('error', errorListener)
            })
          })
          .error(function(err) {
            log.error('Shell command "%s" failed due to "%s"'
                , message.command.join(' '), err.message)
            push.send([message.channel,
              wire.makeDeviceFailMessage(options.serial, err.message)])
          })
        break
    }
  })

  // Output
  var push = zmq.socket('push')
  options.endpoints.push.forEach(function(endpoint) {
    log.info('Sending output to %s', endpoint)
    push.connect(endpoint)
  })

  function poke() {
    push.send([wireutil.global,
      wireutil.makeDevicePokeMessage(options.serial, solo)])
  }

  function gracefullyExit() {
    log.info('Bye')
    process.exit(0)
  }

  process.on('SIGINT', function() {
    gracefullyExit()
  })

  process.on('SIGTERM', function() {
    gracefullyExit()
  })
}
