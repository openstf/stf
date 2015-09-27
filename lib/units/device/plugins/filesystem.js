var syrup = require('stf-syrup')
var path = require('path')

var logger = require('../../../util/logger')
var wire = require('../../../wire')
var wireutil = require('../../../wire/util')

module.exports = syrup.serial()
  .dependency(require('../support/adb'))
  .dependency(require('../support/router'))
  .dependency(require('../support/push'))
  .dependency(require('../support/storage'))
  .define(function(options, adb, router, push, storage) {
    var log = logger.createLogger('device:plugins:filesystem')
    var plugin = Object.create(null)

    plugin.retrieve = function(file) {
      log.info('Retrieving file "%s"', file)

      return adb.stat(options.serial, file)
        .then(function(stats) {
          return adb.pull(options.serial, file)
            .then(function(transfer) {
              // We may have add new storage plugins for various file types
              // in the future, and add proper detection for the mimetype.
              // But for now, let's just use application/octet-stream for
              // everything like it's 2001.
              return storage.store('blob', transfer, {
                filename: path.basename(file)
              , contentType: 'application/octet-stream'
              , knownLength: stats.size
              })
            })
        })
    }

    router.on(wire.FileSystemGetMessage, function(channel, message) {
      var reply = wireutil.reply(options.serial)
      plugin.retrieve(message.file)
        .then(function(file) {
          push.send([
            channel
          , reply.okay('success', file)
          ])
        })
        .catch(function(err) {
          log.warn('Unable to retrieve "%s"', message.file, err.stack)
          push.send([
            channel
          , reply.fail(err.message)
          ])
        })
    })

    router.on(wire.FileSystemListMessage, function(channel, message) {
      var reply = wireutil.reply(options.serial)
      adb.readdir(options.serial, message.dir)
        .then(function(files) {
          push.send([
            channel
          , reply.okay('success', files)
          ])
        })
        .catch(function(err) {
          log.warn('Unable to list directory "%s"', message.dir, err.stack)
          push.send([
            channel
          , reply.fail(err.message)
          ])
        })
    })

    return plugin
  })
