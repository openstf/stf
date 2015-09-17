var util = require('util')

var syrup = require('stf-syrup')
var adbkit = require('adbkit')
var path = require('path')

var logger = require('../../../util/logger')
var wire = require('../../../wire')
var wireutil = require('../../../wire/util')

module.exports = syrup.serial()
  .dependency(require('../support/adb'))
  .dependency(require('../support/router'))
  .dependency(require('../support/push'))
  .dependency(require('../support/storage'))
  .dependency(require('../resources/minicap'))
  .dependency(require('./util/display'))
  .define(function(options, adb, router, push, storage, minicap, display) {
    var log = logger.createLogger('device:plugins:filesystem')
    var plugin = Object.create(null)

    plugin.retrive = function(file) {
      log.info('Retriving file %s', file)

      return adb.pull(options.serial, file)
        .then(adbkit.util.readAll)
        .then(function(){
          return adb.stat(options.serial, file)
        })
        .then(function(stats){
          if (stats.size == 0){
            log.info(util.format("File %s is empty", file))
          }

          return adb.pull(options.serial, file)
            .then(function(transfer){
              // if this is a new store type, somethings need add to units/storage/plugins/
              return storage.store('blob', transfer, { 
                filename: path.basename(file),
                contentType: 'text/plain', // FIXME(ssx): need to detect file type
                knownLength: stats.size
              })
            })
        })
        .finally(function(){
          log.info(util.format("file %s transfer finished", file))
        })
    }

    router.on(wire.FileSystemGetMessage, function(channel, message) {
      var reply = wireutil.reply(options.serial)
      plugin.retrive(message.file)
        .then(function(file){
          push.send([
            channel,
            reply.okay('success', file)
          ])
        })
        .catch(function(err){
          log.error('File retrive %s failed\n%s', message.file, err.stack)
          push.send([
            channel,
            reply.fail(err.message)
          ])
        })
    })

    return plugin;
    


    // function projectionFormat() {
    //   return util.format(
    //     '%dx%d@%dx%d/%d'
    //   , display.properties.width
    //   , display.properties.height
    //   , display.properties.width
    //   , display.properties.height
    //   , display.properties.rotation
    //   )
    // }

    // plugin.capture = function() {
    //   log.info('Capturing screenshot')

    //   var file = util.format('/data/local/tmp/minicap_%d.jpg', Date.now())
    //   return minicap.run(util.format(
    //       '-P %s -s >%s', projectionFormat(), file))
    //     .then(adbkit.util.readAll)
    //     .then(function() {
    //       return adb.stat(options.serial, file)
    //     })
    //     .then(function(stats) {
    //       if (stats.size === 0) {
    //         throw new Error('Empty screenshot; possibly secure screen?')
    //       }

    //       return adb.pull(options.serial, file)
    //         .then(function(transfer) {
    //           return storage.store('image', transfer, {
    //             filename: util.format('%s.jpg', options.serial)
    //           , contentType: 'image/jpeg'
    //           , knownLength: stats.size
    //           })
    //         })
    //     })
    //     .finally(function() {
    //       return adb.shell(options.serial, ['rm', '-f', file])
    //         .then(adbkit.util.readAll)
    //     })
    // }

    // router.on(wire.ScreenCaptureMessage, function(channel) {
    //   var reply = wireutil.reply(options.serial)
    //   plugin.capture()
    //     .then(function(file) {
    //       push.send([
    //         channel
    //       , reply.okay('success', file)
    //       ])
    //     })
    //     .catch(function(err) {
    //       log.error('Screen capture failed', err.stack)
    //       push.send([
    //         channel
    //       , reply.fail(err.message)
    //       ])
    //     })
    // })

    // return plugin
  })
