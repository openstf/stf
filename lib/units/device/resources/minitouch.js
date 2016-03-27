var util = require('util')

var Promise = require('bluebird')
var syrup = require('stf-syrup')

var logger = require('../../../util/logger')
var pathutil = require('../../../util/pathutil')
var devutil = require('../../../util/devutil')
var streamutil = require('../../../util/streamutil')

module.exports = syrup.serial()
  .dependency(require('../support/adb'))
  .dependency(require('../support/abi'))
  .define(function(options, adb, abi) {
    logger.createLogger('device:resources:minitouch')

    var resources = {
      bin: {
        src: pathutil.requiredMatch(abi.all.map(function(supportedAbi) {
          return pathutil.vendor(util.format(
            'minitouch/%s/minitouch%s'
          , supportedAbi
          , abi.pie ? '' : '-nopie'
          ))
        }))
      , dest: '/data/local/tmp/minitouch'
      , comm: 'minitouch'
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

    function installAll() {
      return Promise.all([
        removeResource(resources.bin).then(installResource)
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
        , run: function(cmd) {
            return adb.shell(options.serial, util.format(
              'exec %s%s'
            , resources.bin.dest
            , cmd ? util.format(' %s', cmd) : ''
            ))
          }
        }
      })
  })
