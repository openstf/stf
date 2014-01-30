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
  , toDeviceType: function(type) {
      return wire.DeviceStatus[{
        device: 'PHYSICAL'
      , emulator: 'VIRTUAL'
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

      return wireutil.envelope(wire.MessageType.DEVICE_LOG, message)
    }
  , makeGroupMessage: function(channel, timeout, requirements) {
      var message = new wire.GroupMessage(
        channel
      , timeout
      , requirements
      )

      return wireutil.envelope(wire.MessageType.GROUP, message)
    }
  , makeJoinGroupMessage: function(serial) {
      var message = new wire.JoinGroupMessage(serial)
      return wireutil.envelope(wire.MessageType.JOIN_GROUP, message)
    }
  , makeLeaveGroupMessage: function(serial) {
      var message = new wire.LeaveGroupMessage(serial)
      return wireutil.envelope(wire.MessageType.LEAVE_GROUP, message)
    }
  , makeDevicePokeMessage: function(serial, channel) {
      var message = new wire.DevicePokeMessage(serial, channel)
      return wireutil.envelope(wire.MessageType.DEVICE_POKE, message)
    }
  , makeDeviceIdentityMessage: function(serial, identity) {
      var message = new wire.DeviceIdentityMessage(
        serial
      , identity.platform
      , identity.manufacturer
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
        )
      )

      return wireutil.envelope(wire.MessageType.DEVICE_IDENTITY, message)
    }
  , makeDevicePropertiesMessage: function(serial, properties) {
      var message = new wire.DevicePropertiesMessage(
        serial
      , Object.keys(properties).map(function(key) {
          return new wire.DeviceProperty(key, properties[key])
        })
      )

      return wireutil.envelope(wire.MessageType.DEVICE_PROPERTIES, message)
    }
  , makeDeviceStatusMessage: function(serial, type, provider) {
      var message = new wire.DeviceStatusMessage(
        serial
      , wireutil.toDeviceStatus(type)
      , provider
      )

      return wireutil.envelope(wire.MessageType.DEVICE_STATUS, message)
    }
  , makeProbeMessage: function() {
      var message = new wire.ProbeMessage()
      return wireutil.envelope(wire.MessageType.PROBE, message)
    }
  , makeShellCommandMessage: function(channel, command) {
      var message = new wire.ShellCommandMessage(channel, command)
      return wireutil.envelope(wire.MessageType.SHELL_COMMAND, message)
    }
  , makeDeviceDataMessage: function(serial, seq, chunk) {
      var message = new wire.DeviceDataMessage(serial, seq, chunk)
      return wireutil.envelope(wire.MessageType.DEVICE_DATA, message)
    }
  , makeDeviceDoneMessage: function(serial) {
      var message = new wire.DeviceDoneMessage(serial)
      return wireutil.envelope(wire.MessageType.DEVICE_DONE, message)
    }
  , makeDeviceFailMessage: function(serial, reason) {
      var message = new wire.DeviceFailMessage(serial, reason)
      return wireutil.envelope(wire.MessageType.DEVICE_FAIL, message)
    }
  }

  return wireutil
}
