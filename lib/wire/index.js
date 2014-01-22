var path = require('path')

var ProtoBuf = require('protobufjs')

module.exports =
  ProtoBuf.loadProtoFile(path.join(__dirname, 'wire.proto')).build()
