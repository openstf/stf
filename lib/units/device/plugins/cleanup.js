var syrup = require('stf-syrup')
var Promise = require('bluebird')
var _ = require('lodash')

var logger = require('../../../util/logger')
var wire = require('../../../wire')
var wireutil = require('../../../wire/util')

module.exports = syrup.serial()
  .dependency(require('../support/adb'))
  .dependency(require('../resources/service'))
  .dependency(require('./group'))
  .dependency(require('../support/router'))
  .dependency(require('../support/push'))
  .define(function(options, adb, service, group, router, push) {
    var log = logger.createLogger('device:plugins:cleanup')
    var plugin = Object.create(null)

    function listPackages() {
      return adb.getPackages(options.serial)
    }

    function uninstallPackage(pkg) {
      log.info('Cleaning up package "%s"', pkg)
      return adb.uninstall(options.serial, pkg)
        .catch(function(err) {
          log.warn('Unable to clean up package "%s"', pkg, err)
          return true
        })
    }

    router.on(wire.InitialPackagesReceivedMessage, function(channel, message) {
      listPackages()
        .then(function(currentPackages) {
          var remove = _.difference(currentPackages, message.packageNames)
          return Promise.map(remove, uninstallPackage)
        })
    })

    plugin.removePackages = function() {
      push.send([
        wireutil.global
      , wireutil.envelope(new wire.InitialPackagesGetMessage(
          options.serial
        ))
      ])
    }

    return listPackages()
      .then(function(initialPackages) {
        initialPackages.push(service.pkg)

        push.send([
          wireutil.global
        , wireutil.envelope(new wire.InitialPackagesSaveMessage(
            options.serial
          , initialPackages
          ))
        ])

        group.on('leave', function() {
          plugin.removePackages()
        })
      })
      .return(plugin)
  })
