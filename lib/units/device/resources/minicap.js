var util = require('util')
var path = require('path')

var Promise = require('bluebird')
var syrup = require('stf-syrup')

var logger = require('../../../util/logger')
var pathutil = require('../../../util/pathutil')
var devutil = require('../../../util/devutil')
var streamutil = require('../../../util/streamutil')

module.exports = syrup.serial()
  .dependency(require('../support/adb'))
  .dependency(require('../support/properties'))
  .dependency(require('../support/abi'))
  .define(function(options, adb, properties, abi) {
    logger.createLogger('device:resources:minicap')

    var resources = {
      bin: {
        src: pathutil.requiredMatch(abi.all.map(function(supportedAbi) {
          return pathutil.vendor(util.format(
            'minicap/bin/%s/minicap%s'
          , supportedAbi
          , abi.pie ? '' : '-nopie'
          ))
        }))
      , dest: '/data/local/tmp/minicap'
      , comm: 'minicap'
      , mode: 0755
      }
    , lib: {
        // @todo The lib ABI should match the bin ABI. Currently we don't
        // have an x86_64 version of the binary while the lib supports it.
        src: pathutil.requiredMatch(abi.all.reduce(function(all, supportedAbi) {
          return all.concat([
            pathutil.vendor(util.format(
              'minicap/shared/android-%s/%s/minicap.so'
            , properties['ro.build.version.release']
            , supportedAbi
            ))
          , pathutil.vendor(util.format(
              'minicap/shared/android-%d/%s/minicap.so'
            , properties['ro.build.version.sdk']
            , supportedAbi
            ))
          ])
        }, []))
      , dest: '/data/local/tmp/minicap.so'
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
      , removeResource(resources.lib).then(installResource)
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
        , lib: resources.lib.dest
        , run: function(cmd) {
            return adb.shell(options.serial, util.format(
              'LD_LIBRARY_PATH=%s exec %s %s'
            , path.dirname(resources.lib.dest)
            , resources.bin.dest
            , cmd
            ))
          }
        }
      })
  })
