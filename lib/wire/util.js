var uuid = require('node-uuid')

var wire = require('./')

var wireutil = {
  global: '*ALL'
, heartbeat: '*HB'
, makePrivateChannel: function() {
    return uuid.v4(null, new Buffer(16)).toString('base64')
  }
, toDeviceStatus: function(type) {
    return wire.DeviceStatus[{
      device: 'ONLINE'
    , emulator: 'ONLINE'
    , unauthorized: 'UNAUTHORIZED'
    , offline: 'OFFLINE'
    }[type]]
  }
, toDeviceRequirements: function(requirements) {
    return Object.keys(requirements).map(function(name) {
      var item = requirements[name]
      return new wire.DeviceRequirement(
        name
      , item.value
      , wire.RequirementType[item.match.toUpperCase()]
      )
    })
  }
, envelope: function(message) {
    return new wire.Envelope(message.$code, message.encode()).encodeNB()
  }
, transaction: function(channel, message) {
    return new wire.Envelope(
        message.$code
      , message.encode()
      , channel
      )
      .encodeNB()
  }
}

module.exports = wireutil
