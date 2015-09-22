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

    plugin.retrieve = function(file) {
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
                contentType: 'application/octet-stream', // FIXME(ssx): need to detect file type
                knownLength: stats.size
              })
            })
        })
        .finally(function(){
          log.info(util.format("File %s transfer finished", file))
        })
    }

    router.on(wire.FileSystemGetMessage, function(channel, message) {
      var reply = wireutil.reply(options.serial)
      plugin.retrieve(message.file)
        .then(function(file){
          push.send([
            channel,
            reply.okay('success', file)
          ])
        })
        .catch(function(err){
          log.error('File retrieve %s failed\n%s', message.file, err.stack)
          push.send([
            channel,
            reply.fail(err.message)
          ])
        })
    })

    router.on(wire.FileSystemListMessage, function(channel, message){
      var reply = wireutil.reply(options.serial)
      adb.readdir(options.serial, message.dir)
        .then(function(files){
          push.send([
            channel,
            reply.okay('success', files)
          ])
        })
        .catch(function(err){
          log.error('Dir list %s failed\n%s', message.dir, err.stack)
          push.send([
            channel,
            reply.fail(err.message)
          ])
        })
    })
    return plugin;
  })
