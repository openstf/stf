var r = require('rethinkdb')

module.exports = {
  users: {
    primaryKey: 'email'
  }
, devices: {
    primaryKey: 'serial'
  , indexes: {
      ownerEmail: function(device) {
        return device('owner')('email')
      }
    , lastHeartbeatAt: null
    }
  }
, logs: {
    primaryKey: 'id'
  , indexes: {
      serial: null
    , timestamp: null
    }
  }
}
