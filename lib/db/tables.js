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
