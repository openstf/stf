var util = require('util')

var syrup = require('stf-syrup')
var split = require('split')
var adbkit = require('adbkit')
var Promise = require('bluebird')

var logger = require('../../../../util/logger')
var wire = require('../../../../wire')
var wireutil = require('../../../../wire/util')

module.exports = syrup.serial()
  .dependency(require('../../support/adb'))
  .dependency(require('../../support/router'))
  .dependency(require('../../support/push'))
  .dependency(require('../../support/storage'))
  .dependency(require('../filesystem'))
  .define( (options, adb, router, push, _, filesystem) => {
    var log = logger.createLogger('device:plugins:screen:record')
    var plugin = Object.create(null)

    var findProcess = out =>  {
      return new Promise( resolve => {
          out.pipe(split())
            .on('data', chunk => {
              if (chunk.toString().includes("screenrecord")) {
                var cols = chunk.toString().split(/\s+/)
                resolve(cols[1])
              } else {
                resolve("")
              }
          })
        })
    }

    plugin.record = () => {
      log.info("Recording Screen")
      var file = util.format('/data/local/tmp/video_%d.mp4', Date.now())
      return adb.shell(options.serial, "screenrecord " + file)
        .then( _ => {
          return file
        })
    }

    plugin.stopRecording = (file) => {
      log.info("Stopping Screen Recorder")
      return adb.shell(options.serial, 'ps2>/dev/null ')
          .then(findProcess).then( pid => {
            if (pid === "") {
              return adb.shell(options.serial, ['kill', "-2", pid])
                .then(() => {
                  return Promise.delay(2000)
              })
            } else {
                return adb.shell(serial, 'ps -lef 2>/dev/null')
                  .then(findProcess).then(pid => {
                    return adb.shell(options.serial, ['kill', "-2", pid])
                      .then(() => {
                        return Promise.delay(2000)
                    })
                })
            }
        })
        .then(() => {
          return filesystem.retrieve(file)
        }).finally( () => {
          return adb.shell(options.serial, ['rm', '-f', file])
        })
      }

    router.on(wire.ScreenRecordMessage, (channel) => {
      var reply = wireutil.reply(options.serial)
      plugin.record()
        .then( path => {
          push.send([
            channel
          , reply.okay('success', path)
          ])
        })
        .catch(err => {
          log.error('Record Screen failed', err.stack)
          push.send([
            channel
          , reply.okay(err.message)
          ])
        })
    })

    router.on(wire.ScreenStopRecordMessage, (channel, message) => {
      var reply = wireutil.reply(options.serial)
      plugin.stopRecording(message.path)
        .then((file) => {
          push.send([
            channel
          , reply.okay('success', file)
          ])
        })
        .catch(err => {
          log.error('Record Screen failed', err.stack)
          push.send([
            channel
          , reply.okay(err.message)
          ])
        })
    })
    return plugin
  })

