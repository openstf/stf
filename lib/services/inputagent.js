var util = require('util')

var Promise = require('bluebird')
var ProtoBuf = require('protobufjs')
var ByteBuffer = require('protobufjs/node_modules/bytebuffer')
var semver = require('semver')

var pathutil = require('../util/pathutil')
var streamutil = require('../util/streamutil')

var SUPPORTED_VERSION = '~0.1.2';

var pkg = 'jp.co.cyberagent.stf.input.agent'
var apk = pathutil.vendor('InputAgent/InputAgent.apk')
var proto = ProtoBuf.loadProtoFile(
  pathutil.vendor('InputAgent/proto/agent.proto')
).build().jp.co.cyberagent.stf.input.agent.proto

var inputAgent = module.exports = Object.create(null)

function IncompatibleVersionError(version) {
  Error.call(this, util.format('Incompatible version %s', version))
  this.name = 'IncompatibleVersionError'
  this.version = version
  Error.captureStackTrace(this, IncompatibleVersionError)
}

util.inherits(IncompatibleVersionError, Error)

inputAgent.IncompatibleVersionError = IncompatibleVersionError

inputAgent.getInstalledPath = function(adb, serial) {
  return adb.shell(serial, util.format("pm path '%s'", pkg))
    .then(function(out) {
      return streamutil.findLine(out, (/^package:/))
        .then(function(line) {
          return line.substr(8)
        })
    })
}

inputAgent.ensureInstalled = function(adb, serial) {
  return inputAgent.getInstalledPath(adb, serial)
    .then(function(installedPath) {
      return adb.shell(serial, util.format(
          "export CLASSPATH='%s';"
        + ' exec app_process /system/bin'
        + ' jp.co.cyberagent.stf.input.agent.InputAgent --version'
        , installedPath
        ))
        .then(function(out) {
          return streamutil.readAll(out)
            .timeout(10000)
            .then(function(buffer) {
              var version = buffer.toString()
              if (semver.satisfies(version, SUPPORTED_VERSION)) {
                return installedPath
              }
              else {
                return Promise.reject(new IncompatibleVersionError(version))
              }
            })
        })
    })
    .catch(function() {
      return adb.install(serial, apk)
        .then(function() {
          return inputAgent.getInstalledPath(adb, serial)
        })
    })
}

inputAgent.openAgent = function(adb, serial) {
  return inputAgent.ensureInstalled(adb, serial)
    .then(function(installedPath) {
      return adb.shell(serial, util.format(
        "export CLASSPATH='%s';"
      + ' exec app_process /system/bin'
      + ' jp.co.cyberagent.stf.input.agent.InputAgent'
      , installedPath
      ))
    })
}

inputAgent.openService = function(adb, serial) {
  return inputAgent.ensureInstalled(adb, serial)
    .then(function() {
      var intent =
        '-a jp.co.cyberagent.stf.input.agent.InputService.ACTION_START'
      return adb.shell(serial, util.format(
        'am startservice --user 0 %s || am startservice %s'
      , intent
      , intent
      ))
    })
}

inputAgent.stopService = function(adb, serial) {
  var intent = '-a jp.co.cyberagent.stf.input.agent.InputService.ACTION_STOP'
  return adb.shell(serial, util.format(
    'am startservice --user 0 %s || am startservice %s'
  , intent
  , intent
  ))
}

inputAgent.sendInputEvent = function(agent, event) {
  var lengthBuffer = new ByteBuffer()
    , messageBuffer = new proto.InputEvent(event).encode()

  lengthBuffer.writeVarint32(messageBuffer.length)

  agent.write(Buffer.concat([
    lengthBuffer.toBuffer()
  , messageBuffer.toBuffer()
  ]))
}

inputAgent.unlock = function(service) {
  service.write('unlock\n');
}

inputAgent.lock = function(service) {
  service.write('lock\n');
}

inputAgent.acquireWakeLock = function(service) {
  service.write('acquire wake lock\n');
}

inputAgent.releaseWakeLock = function(service) {
  service.write('release wake lock\n');
}

inputAgent.identity = function(service, serial) {
  service.write(util.format('show identity %s\n', serial));
}
