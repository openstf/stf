var uuid = require('node-uuid')

module.exports = function(wire) {
  var wireutil = {
    global: '*ALL'
  , log: '*LOG'
  , makePrivateChannel: function() {
      return uuid.v4(null, new Buffer(16)).toString('base64')
    }
  , toDeviceStatus: function(type) {
      return wire.DeviceStatus[{
        device: 'ONLINE'
      , emulator: 'ONLINE'
      , unauthorized: 'UNAUTHORIZED'
      , offline: 'OFFLINE'
      , absent: 'ABSENT'
      }[type]]
    }
  , envelope: function(type, message) {
      return new wire.Envelope(type, message.encode()).encodeNB()
    }
  , makeDeviceLogMessage: function(serial, entry) {
      var message = new wire.DeviceLogMessage(
        serial
      , entry.timestamp / 1000
      , entry.priority
      , entry.tag
      , entry.pid
      , entry.message
      , entry.identifier
      )

      return wireutil.envelope(wire.MessageType.DeviceLogMessage, message)
    }
  , makeGroupMessage: function(channel, timeout, requirements) {
      var message = new wire.GroupMessage(
        channel
      , timeout
      , requirements
      )

      return wireutil.envelope(wire.MessageType.GroupMessage, message)
    }
  , makeUngroupMessage: function(requirements) {
      var message = new wire.UngroupMessage(requirements)
      return wireutil.envelope(wire.MessageType.UngroupMessage, message)
    }
  , makeJoinGroupMessage: function(serial) {
      var message = new wire.JoinGroupMessage(serial)
      return wireutil.envelope(wire.MessageType.JoinGroupMessage, message)
    }
  , makeLeaveGroupMessage: function(serial) {
      var message = new wire.LeaveGroupMessage(serial)
      return wireutil.envelope(wire.MessageType.LeaveGroupMessage, message)
    }
  , makeDevicePokeMessage: function(serial, channel) {
      var message = new wire.DevicePokeMessage(serial, channel)
      return wireutil.envelope(wire.MessageType.DevicePokeMessage, message)
    }
  , makeDeviceIdentityMessage: function(serial, identity) {
      var message = new wire.DeviceIdentityMessage(
        serial
      , identity.platform
      , identity.manufacturer
      , identity.operator
      , identity.model
      , identity.version
      , identity.abi
      , identity.sdk
      , new wire.DeviceDisplayMessage(
          identity.display.id
        , identity.display.width
        , identity.display.height
        , identity.display.orientation
        , identity.display.xdpi
        , identity.display.ydpi
        , identity.display.fps
        , identity.display.density
        , identity.display.secure
        , identity.display.url
        )
      )

      return wireutil.envelope(wire.MessageType.DeviceIdentityMessage, message)
    }
  , makeDevicePropertiesMessage: function(serial, properties) {
      var message = new wire.DevicePropertiesMessage(
        serial
      , Object.keys(properties).map(function(key) {
          return new wire.DeviceProperty(key, properties[key])
        })
      )

      return wireutil.envelope(
        wire.MessageType.DevicePropertiesMessage
      , message
      )
    }
  , makeDeviceStatusMessage: function(serial, type, provider) {
      var message = new wire.DeviceStatusMessage(
        serial
      , wireutil.toDeviceStatus(type)
      , provider
      )

      return wireutil.envelope(wire.MessageType.DeviceStatusMessage, message)
    }
  , makeProbeMessage: function() {
      var message = new wire.ProbeMessage()
      return wireutil.envelope(wire.MessageType.ProbeMessage, message)
    }
  , makeShellCommandMessage: function(channel, command) {
      var message = new wire.ShellCommandMessage(channel, command)
      return wireutil.envelope(wire.MessageType.ShellCommandMessage, message)
    }
  , makeShellCommandDataMessage: function(serial, seq, chunk) {
      var message = new wire.ShellCommandDataMessage(serial, seq, chunk)
      return wireutil.envelope(
        wire.MessageType.ShellCommandDataMessage
      , message
      )
    }
  , makeShellCommandDoneMessage: function(serial) {
      var message = new wire.ShellCommandDoneMessage(serial)
      return wireutil.envelope(
        wire.MessageType.ShellCommandDoneMessage
      , message
      )
    }
  , makeShellCommandFailMessage: function(serial, reason) {
      var message = new wire.ShellCommandFailMessage(serial, reason)
      return wireutil.envelope(
        wire.MessageType.ShellCommandFailMessage
      , message
      )
    }
  }

  return wireutil
}
