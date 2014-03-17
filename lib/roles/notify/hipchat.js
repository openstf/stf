var util = require('util')

var Hipchatter = require('hipchatter')
var Promise = require('bluebird')
var zmq = require('zmq')

var logger = require('../../util/logger')
var wire = require('../../wire')
var wirerouter = require('../../wire/router')
var wireutil = require('../../wire/util')

module.exports = function(options) {
  var log = logger.createLogger('notify-hipchat')
  var client = Promise.promisifyAll(new Hipchatter(options.token))
  var buffer = []
    , timer

  // Input
  var sub = zmq.socket('sub')
  options.endpoints.sub.forEach(function(endpoint) {
    log.info('Receiving input from %s', endpoint)
    sub.connect(endpoint)
  })

  // Establish always-on channels
  ;[wireutil.global].forEach(function(channel) {
    log.info('Subscribing to permanent channel "%s"', channel)
    sub.subscribe(channel)
  })

  sub.on('message', wirerouter()
    .on(wire.DeviceLogMessage, function(channel, message) {
      if (message.priority >= options.priority) {
        buffer.push(message)
        clearTimeout(timer)
        timer = setTimeout(push, 1000)
      }
    })
    .handler())

  function push() {
    var messages = buffer.splice(0).map(function(entry) {
      return util.format(
        '<strong>%s</strong>/<strong>%s</strong> %d [<strong>%s</strong>] %s'
      , logger.LevelLabel[entry.priority]
      , entry.tag
      , entry.pid
      , entry.identifier
      , entry.message
      )
    })

    log.info('Sending %d message(s)', messages.length)

    return client.notifyAsync(options.room, {
      message: messages.join('<br>')
    , color: 'purple'
    , notify: true
    , message_format: 'html'
    , token: options.token
    })
  }

  function gracefullyExit() {
    process.exit(0)
  }

  process.on('SIGINT', function() {
    gracefullyExit()
  })

  process.on('SIGTERM', function() {
    gracefullyExit()
  })

  log.info('Listening for %s (or higher) level log messages',
    logger.LevelLabel[options.priority])
}
