var util = require('util')

var Promise = require('bluebird')
var ProtoBuf = require('protobufjs')
var ByteBuffer = require('protobufjs/node_modules/bytebuffer')
var split = require('split')

var pathutil = require('../util/pathutil')
var streamutil = require('../util/streamutil')

var proto = ProtoBuf.loadProtoFile(
  pathutil.vendor('InputAgent/inputAgentProtocol.proto')
).build().jp.co.cyberagent.stf.input.agent

var inputAgent = module.exports = Object.create(null)

inputAgent.open = function(adb, serial) {
  return adb.installAsync(serial, pathutil.vendor('InputAgent/InputAgent.apk'))
    .then(function() {
      return adb.shellAsync(serial, 'pm path jp.co.cyberagent.stf.input.agent')
    })
    .then(function(out) {
      return streamutil.findLine(out, (/^package:/))
        .then(function(line) {
          return line.substr(8)
        })
    })
    .then(function(apk) {
      return adb.shellAsync(serial, util.format(
        "export CLASSPATH='%s';"
      + ' exec app_process /system/bin'
      + ' jp.co.cyberagent.stf.input.agent.InputAgent'
      , apk
      ))
    })
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
