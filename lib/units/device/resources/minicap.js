var fs = require('fs')
var util = require('util')
var path = require('path')

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
  .dependency(require('../support/abi'))
  .dependency(require('../support/sdk'))
  .define(function(options, adb, properties, abi, sdk) {
    var log = logger.createLogger('device:resources:minicap')

    var resources = {
      bin: new Resource({
        src: pathutil.requiredMatch(abi.all.map(function(supportedAbi) {
          return pathutil.module(util.format(
            'minicap-prebuilt/prebuilt/%s/bin/minicap%s'
          , supportedAbi
          , abi.pie ? '' : '-nopie'
          ))
        }))
      , dest: [
          '/data/local/tmp/minicap'
        , '/data/data/com.android.shell/minicap'
        ]
      , comm: 'minicap'
      , mode: 0755
      })
    , lib: new Resource({
        // @todo The lib ABI should match the bin ABI. Currently we don't
        // have an x86_64 version of the binary while the lib supports it.
        src: pathutil.requiredMatch(abi.all.reduce(function(all, supportedAbi) {
          return all.concat([
            pathutil.module(util.format(
              'minicap-prebuilt/prebuilt/%s/lib/android-%s/minicap.so'
            , supportedAbi
            , sdk.previewLevel
            ))
          , pathutil.module(util.format(
              'minicap-prebuilt/prebuilt/%s/lib/android-%s/minicap.so'
            , supportedAbi
            , sdk.level
            ))
          ])
        }, []))
      , dest: [
          '/data/local/tmp/minicap.so'
        , '/data/data/com.android.shell/minicap.so'
        ]
      , comm: 'minicap.so' // Not actually used for anything but log output
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
      log.info('Installing "%s" as "%s"', res.src, res.dest)

      function checkExecutable(res) {
        return adb.stat(options.serial, res.dest)
          .timeout(5000)
          .then(function(stats) {
            // Can't use fs.constants.S_IXUSR due to differences on Windows.
            return (stats.mode & 0x40) === 0x40
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
      , installResource(resources.lib)
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
