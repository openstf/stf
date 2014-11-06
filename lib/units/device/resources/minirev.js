var util = require('util')

var Promise = require('bluebird')
var syrup = require('stf-syrup')

var logger = require('../../../util/logger')
var pathutil = require('../../../util/pathutil')
var devutil = require('../../../util/devutil')
var streamutil = require('../../../util/streamutil')

module.exports = syrup.serial()
  .dependency(require('../support/adb'))
  .dependency(require('../support/properties'))
  .define(function(options, adb, properties) {
    var log = logger.createLogger('device:resources:minirev')

    var resources = {
      bin: {
        src: pathutil.vendor(util.format(
          'minirev/%s/minirev%s'
        , properties['ro.product.cpu.abi']
        , properties['ro.build.version.sdk'] < 16 ? '-nopie' : ''
        ))
      , dest: '/data/local/tmp/minirev'
      , comm: 'minirev'
      , mode: 0755
      }
    }

    function removeResource(res) {
      return adb.shell(options.serial, ['rm', res.dest])
        .timeout(10000)
        .then(function(out) {
          return streamutil.readAll(out)
        })
        .return(res)
    }

    function installResource(res) {
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

    function ensureNotBusy(res) {
      return adb.shell(options.serial, [res.dest, '-h'])
        .timeout(10000)
        .then(function(out) {
          // Can be "Text is busy", "text busy"
          return streamutil.findLine(out, (/busy/i))
            .timeout(10000)
            .then(function() {
              log.info('Binary is busy, will retry')
              return Promise.delay(1000)
            })
            .then(function() {
              return ensureNotBusy(res)
            })
            .catch(streamutil.NoSuchLineError, function() {
              return res
            })
        })
    }

    function installAll() {
      return Promise.all([
        removeResource(resources.bin).then(installResource).then(ensureNotBusy)
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
