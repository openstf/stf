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
      return setup(conn)
    })
    .catch(function(err) {
      log.fatal('Unable to connect to the database: "%s"', err.message)
      process.exit(1)
    })
}

var db = module.exports = Object.create(null)

// Export memoized connection as a Promise
db.connect = (function() {
  var connection = connect()
  return function() {
    return connection
  }
})()

// Small utility for running queries without having to acquire a connection
db.run = function(q) {
  return db.connect().then(function(conn) {
    return rutil.run(conn, q)
  })
}
