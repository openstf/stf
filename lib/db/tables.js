var r = require('rethinkdb')

module.exports = {
  users: {
    primaryKey: 'email'
  }
, devices: {
    primaryKey: 'serial'
  , indexes: {
      owner: function(device) {
        return r.branch(
          device('present')
        , device('owner')('email')
        , r.literal()
        )
      }
    , lastHeartbeatAt: null
    , providerChannel: function(device) {
        return device('provider')('channel')
      }
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
