var setup = require('./setup')
var rutil = require('../util/rutil')
var logger = require('../util/logger')

function connect() {
  var log = logger.createLogger('db')
  return rutil.connect({
      host: process.env.RDB_HOST || 'localhost'
    , port: process.env.RDB_PORT || 28015
    , db: process.env.RDB_DB || 'stf'
    , authKey: process.env.RDB_AUTHKEY
    })
    .then(function(conn) {
      conn.on('error', function(err) {
        log.fatal('Connection error', err.stack)
        process.exit(1)
      })
      return conn
    })
}

module.exports = connect().then(setup)
