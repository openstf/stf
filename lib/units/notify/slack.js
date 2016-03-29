var util = require('util')

var WebClient = require('slack-client').WebClient
var Promise = require('bluebird')

var logger = require('../../util/logger')
var wire = require('../../wire')
var wirerouter = require('../../wire/router')
var wireutil = require('../../wire/util')
var lifecycle = require('../../util/lifecycle')
var srv = require('../../util/srv')
var zmqutil = require('../../util/zmqutil')


module.exports = function(options) {
  var log = logger.createLogger('notify-slack')
  var client = new WebClient(options.token)
  var buffer = []
  var timer

  // Input
  var sub = zmqutil.socket('sub')
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

  function push() {
    buffer.splice(0).forEach(function(entry) {
      var format = entry.message.indexOf('\n') === -1 ? '`%s`' : '```%s```'
      var message = util.format(format, entry.message)

      client.chat.postMessage(options.channel, util.format(
        '>>> *%s/%s* %d [*%s*] %s'
        , logger.LevelLabel[entry.priority]
        , entry.tag
        , entry.pid
        , entry.identifier
        , message
        )
        , {
          username: 'STF'
          , icon_url: 'https://openstf.io/favicon.png'
        }
      )
    })
  }

  sub.on('message', wirerouter()
    .on(wire.DeviceLogMessage, function(channel, message) {
      if (message.priority >= options.priority) {
        buffer.push(message)
        clearTimeout(timer)
        timer = setTimeout(push, 1000)
      }
    })
    .handler())

  log.info('Listening for %s (or higher) level log messages',
    logger.LevelLabel[options.priority])

  lifecycle.observe(function() {
    try {
      sub.close()
    }
    catch (err) {
      // No-op
    }
  })
}
