var r = require('rethinkdb')

module.exports = {
  users: {
    primaryKey: 'email'
  , indexes: {
      adbKeys: {
        indexFunction: function(user) {
          return user('adbKeys')('fingerprint')
        }
      , options: {
          multi: true
        }
      }
    }
  }
, devices: {
    primaryKey: 'serial'
  , indexes: {
      owner: {
        indexFunction: function(device) {
          return r.branch(
            device('present')
          , device('owner')('email')
          , r.literal()
          )
        }
      }
    , present: null
    , providerChannel: {
        indexFunction: function(device) {
          return device('provider')('channel')
        }
      }
    }
  }
, logs: {
    primaryKey: 'id'
  }
, schedules: {
    primaryKey: 'id'
  , indexes: {
      serial: null
    , start: null
    , end: null
    }
  }
}
