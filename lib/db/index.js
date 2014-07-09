var setup = require('./setup')
var rutil = require('../util/rutil')
var logger = require('../util/logger')
var lifecycle = require('../util/lifecycle')

var db = module.exports = Object.create(null)
var log = logger.createLogger('db')

function connect() {
  return rutil.connect({
      // These environment variables are exposed when we --link to a
      // RethinkDB container.
      host: process.env.RETHINKDB_PORT_28015_TCP_ADDR || '127.0.0.1'
    , port: process.env.RETHINKDB_PORT_28015_TCP_PORT || 28015
    , db: process.env.RETHINKDB_ENV_DATABASE || 'stf'
    , authKey: process.env.RETHINKDB_ENV_AUTHKEY
    })
    .then(function(conn) {
      lifecycle.observe(function() {
        return db.close()
      })

      return conn.on('error', function(err) {
        log.fatal('Connection error', err.stack)
        lifecycle.fatal()
      })
    })
    .catch(function(err) {
      log.fatal('Unable to connect to the database: "%s"', err.message)
      lifecycle.fatal()
    })
}

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
