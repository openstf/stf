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
    var log = logger.createLogger('device:resources:inputagent')

    var resource = {
      requiredVersion: '~0.1.2'
    , pkg: 'jp.co.cyberagent.stf.input.agent'
    , main: 'jp.co.cyberagent.stf.input.agent.InputAgent'
    , apk: pathutil.vendor('InputAgent/InputAgent.apk')
    , proto: ProtoBuf.loadProtoFile(
        pathutil.vendor('InputAgent/proto/agent.proto')
      ).build().jp.co.cyberagent.stf.input.agent.proto
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
      log.info('Checking whether we need to install InputAgent.apk')
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
          log.info('Installing InputAgent.apk')
          return adb.install(options.serial, resource.apk)
            .then(function() {
              return getPath()
            })
        })
    }

    return install()
      .then(function(path) {
        log.info('InputAgent.apk up to date')
        return {
          path: path
        , pkg: resource.pkg
        , main: resource.main
        , proto: resource.proto
        }
      })
  })
