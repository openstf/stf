var syrup = require('stf-syrup')

var logger = require('../../../util/logger')
var wire = require('../../../wire')
var wireutil = require('../../../wire/util')
var Promise = require('bluebird')
var _ = require('lodash')
var dbapi = require('../../../db/api')

module.exports = syrup.serial()
  .dependency(require('../support/adb'))
  .dependency(require('../support/router'))
  .dependency(require('../support/push'))
  .dependency(require('../resources/service'))
  .define(function(options, adb, router, push, service) {
    var log = logger.createLogger('device:plugins:wipeout')
    var plugin = Object.create(null)

    function listPackages() {
      return adb.getPackages(options.serial)
    }

    function uninstallPackage(pkg) {
      log.info('Cleaning up package "%s"', pkg)
      return adb.uninstall(options.serial, pkg)
        .catch(function (err) {
          log.warn('Unable to clean up package "%s"', pkg, err)
          return true
        })
    }

    return listPackages()
      .then(function (initialPackages) {
        initialPackages.push(service.pkg);

        plugin.removePackages = function () {
          return listPackages()
            .then(function (currentPackages) {
              var remove = _.difference(currentPackages, initialPackages)
              return Promise.map(remove, uninstallPackage)
            })
        }

        router.on(wire.WipeOutMessage, function (channel) {
          var reply = wireutil.reply(options.serial)
          log.important('Wiping This Device Out')

          dbapi.setDeviceInWipeOut(options.serial).then(()=>{
            log.important('Starting device wiping')
          })
          plugin.removePackages(options.serial)
            .then(function () {
              push.send([
                channel
                , reply.okay()
              ])

              dbapi.setDeviceDoneWipeOut(options.serial).then(()=>{
                log.important('Finished device wiping')
              })
            })
            .error(function (err) {
              log.error('Reboot failed', err.stack)
              push.send([
                channel
                , reply.fail(err.message)
              ])
            })
        })

      })
  })
