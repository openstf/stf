var setup = require('./setup')
var rutil = require('../util/rutil')
var logger = require('../util/logger')
var lifecycle = require('../util/lifecycle')

function connect() {
  var log = logger.createLogger('db')
  return rutil.connect({
      host: process.env.RDB_HOST || 'localhost'
    , port: process.env.RDB_PORT || 28015
    , db: process.env.RDB_DB || 'stf'
    , authKey: process.env.RDB_AUTHKEY
    })
    .then(function(conn) {
      return conn.on('error', function(err) {
        log.fatal('Connection error', err.stack)
        lifecycle.fatal()
      })
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

// Close connection, we don't really care if it hasn't been created yet or not
db.close = function() {
  return db.connect().then(function(conn) {
    return rutil.close(conn)
  })
}

// Small utility for running queries without having to acquire a connection
db.run = function(q, options) {
  return db.connect().then(function(conn) {
    return rutil.run(conn, q, options)
  })
}

// Sets up the database
db.setup = function() {
  return db.connect().then(function(conn) {
    return setup(conn)
  })
}
