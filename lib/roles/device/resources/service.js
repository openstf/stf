var util = require('util')

var syrup = require('syrup')
var ProtoBuf = require('protobufjs')
var semver = require('semver')

var pathutil = require('../../../util/pathutil')
var streamutil = require('../../../util/streamutil')
var logger = require('../../../util/logger')

module.exports = syrup.serial()
  .dependency(require('../support/adb'))
  .define(function(options, adb) {
    var log = logger.createLogger('device:resources:service')

    var resource = {
      requiredVersion: '~0.2.0'
    , pkg: 'jp.co.cyberagent.stf'
    , main: 'jp.co.cyberagent.stf.InputAgent'
    , apk: pathutil.vendor('STFService/STFService.apk')
    , agentProto: ProtoBuf.loadProtoFile(
        pathutil.vendor('STFService/proto/agent.proto')
      ).build().jp.co.cyberagent.stf.proto
    , serviceProto: ProtoBuf.loadProtoFile(
        pathutil.vendor('STFService/proto/service.proto')
      ).build().jp.co.cyberagent.stf.proto
    , startAction: 'jp.co.cyberagent.stf.ACTION_START'
    , stopAction: 'jp.co.cyberagent.stf.ACTION_STOP'
    }

    function getPath() {
      return adb.shell(options.serial, ['pm', 'path', resource.pkg])
        .then(function(out) {
          return streamutil.findLine(out, (/^package:/))
            .then(function(line) {
              return line.substr(8)
            })
        })
    }

    function install() {
      log.info('Checking whether we need to install STFService')
      return getPath()
        .then(function(installedPath) {
          log.info('Running version check')
          return adb.shell(options.serial, util.format(
            "export CLASSPATH='%s';" +
            " exec app_process /system/bin '%s' --version"
          , installedPath
          , resource.main
          ))
          .then(function(out) {
            return streamutil.readAll(out)
              .timeout(10000)
              .then(function(buffer) {
                var version = buffer.toString()
                throw new Error(util.format(
                  'Incompatible version %s'
                , version
                ))
                if (semver.satisfies(version, resource.requiredVersion)) {
                  return installedPath
                }
                else {
                  throw new Error(util.format(
                    'Incompatible version %s'
                  , version
                  ))
                }
              })
          })
        })
        .catch(function() {
          log.info('Installing STFService')
          return adb.install(options.serial, resource.apk)
            .then(function() {
              return getPath()
            })
        })
    }

    return install()
      .then(function(path) {
        log.info('STFService up to date')
        resource.path = path
        return resource
      })
  })
