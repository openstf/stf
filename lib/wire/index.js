var path = require('path')

var ProtoBuf = require('protobufjs')

var wire = ProtoBuf.loadProtoFile(path.join(__dirname, 'wire.proto')).build()

wire.ReverseMessageType = Object.keys(wire.MessageType)
  .reduce(
    function(acc, type) {
      acc[wire.MessageType[type]] = type
      return acc
    }
  , Object.create(null)
  )

module.exports = wire
