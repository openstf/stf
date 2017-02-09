var fs = require('fs')
var util = require('util')

var Promise = require('bluebird')
var syrup = require('stf-syrup')

var logger = require('../../../util/logger')
var pathutil = require('../../../util/pathutil')
var devutil = require('../../../util/devutil')
var streamutil = require('../../../util/streamutil')
var Resource = require('./util/resource')

module.exports = syrup.serial()
  .dependency(require('../support/adb'))
  .dependency(require('../support/properties'))
  .define(function(options, adb, properties) {
    var log = logger.createLogger('device:resources:minirev')

    var resources = {
      bin: new Resource({
        src: pathutil.vendor(util.format(
          'minirev/%s/minirev%s'
        , properties['ro.product.cpu.abi']
        , properties['ro.build.version.sdk'] < 16 ? '-nopie' : ''
        ))
      , dest: [
          '/data/local/tmp/minirev'
        , '/data/data/com.android.shell/minirev'
        ]
      , comm: 'minirev'
      , mode: 0755
      })
    }

    function removeResource(res) {
      return adb.shell(options.serial, ['rm', res.dest])
        .timeout(10000)
        .then(function(out) {
          return streamutil.readAll(out)
        })
        .return(res)
    }

    function pushResource(res) {
      return adb.push(options.serial, res.src, res.dest, res.mode)
        .timeout(10000)
        .then(function(transfer) {
          return new Promise(function(resolve, reject) {
            transfer.on('error', reject)
            transfer.on('end', resolve)
          })
        })
        .return(res)
    }

    function installResource(res) {
      log.info('Installing "%s" as "%s"', res.comm, res.dest)

      function checkExecutable(res) {
        return adb.stat(options.serial, res.dest)
          .timeout(5000)
          .then(function(stats) {
            return (stats.mode & fs.constants.S_IXUSR) === fs.constants.S_IXUSR
          })
      }

      return removeResource(res)
        .then(pushResource)
        .then(function(res) {
          return checkExecutable(res).then(function(ok) {
            if (!ok) {
              log.info(
                'Pushed "%s" not executable, attempting fallback location'
              , res.comm
              )
              res.shift()
              return installResource(res)
            }
            return res
          })
        })
        .return(res)
    }

    function installAll() {
      return Promise.all([
        installResource(resources.bin)
      ])
    }

    function stop() {
      return devutil.killProcsByComm(
          adb
        , options.serial
        , resources.bin.comm
        , resources.bin.dest
        )
        .timeout(15000)
    }

    return stop()
      .then(installAll)
      .then(function() {
        return {
          bin: resources.bin.dest
        }
      })
  })
