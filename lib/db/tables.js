module.exports = {
  users: {
    primaryKey: 'email'
  }
, devices: {
    primaryKey: 'serial'
  }
, logs: {
    primaryKey: 'id'
  , indexes: {
      serial: null
    , timestamp: null
    }
  }
}
