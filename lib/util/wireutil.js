var semver = require('semver')
var minimatch = require('minimatch')
var uuid = require('node-uuid')

module.exports = function(wire) {
  var wireutil = {
    global: '*ALL'
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
  , matchesRequirements: function(capabilities, requirements) {
      return requirements.every(function(req) {
        var capability = capabilities[req.name]

        if (!capability) {
          return false
        }

        switch (req.type) {
          case wire.RequirementType.SEMVER:
            if (!semver.satisfies(capability, req.value)) {
              return false
            }
            break
          case wire.RequirementType.GLOB:
            if (!minimatch(capability, req.value)) {
              return false
            }
            break
          case wire.RequirementType.EXACT:
            if (capability !== req.value) {
              return false
            }
            break
          default:
            return false
        }
      })
    }
  , envelope: function(type, message) {
      return new wire.Envelope(type, message.encode()).encodeNB()
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
  , makeDevicePropertiesMessage: function(serial, properties) {
      var message = new wire.DevicePropertiesMessage(
        serial
      , Object.keys(properties).map(function(key) {
          return new wire.DeviceProperty(key, properties[key])
        })
      )

      return wireutil.envelope(wire.MessageType.DEVICE_PROPERTIES, message)
    }
  , makeDeviceStatusMessage: function(serial, type) {
      var message = new wire.DeviceStatusMessage(
        serial
      , wireutil.toDeviceStatus(type)
      )

      return wireutil.envelope(wire.MessageType.DEVICE_STATUS, message)
    }
  , makeProbeMessage: function() {
      var message = new wire.ProbeMessage()
      return wireutil.envelope(wire.MessageType.PROBE, message)
    }
  }

  return wireutil
}
