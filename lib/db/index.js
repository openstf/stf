var r = require('rethinkdb')
var Promise = require('bluebird')

var setup = require('./setup')
var logger = require('../util/logger')
var lifecycle = require('../util/lifecycle')
var srv = require('../util/srv')

var db = module.exports = Object.create(null)
var log = logger.createLogger('db')

function connect() {
  var options = {
    // These environment variables are exposed when we --link to a
    // RethinkDB container.
    url: process.env.RETHINKDB_PORT_28015_TCP || 'tcp://127.0.0.1:28015'
  , db: process.env.RETHINKDB_ENV_DATABASE || 'stf'
  , authKey: process.env.RETHINKDB_ENV_AUTHKEY
  }

  return srv.resolve(options.url)
    .then(function(records) {
      function next() {
        var record = records.shift()

        if (!record) {
          throw new Error('No hosts left to try')
        }

        log.info('Connecting to %s:%d', record.name, record.port)

        return r.connect({
            host: record.name
          , port: record.port
          , db: options.db
          , authKey: options.authKey
          })
          .catch(r.Error.RqlDriverError, function() {
            log.info('Unable to connect to %s:%d', record.name, record.port)
            return next()
          })
      }

      return next()
    })
}

// Export connection as a Promise
db.connect = (function() {
  var connection
  var queue = []

  lifecycle.observe(function() {
    if (connection) {
      return connection.close()
    }
  })

  function createConnection() {
    return connect()
      .then(function(conn) {
        connection = conn

        conn.on('close', function closeListener() {
          log.warn('Connection closed')
          connection = null
          conn.removeListener('close', closeListener)
          createConnection()
        })

        queue.splice(0).forEach(function(resolver) {
          resolver.resolve(conn)
        })

        return conn
      })
      .catch(function(err) {
        log.fatal(err.message)
        lifecycle.fatal()
      })
  }

  createConnection()

  return function() {
    return new Promise(function(resolve, reject) {
      if (connection) {
        resolve(connection)
      }
      else {
        queue.push({
          resolve: resolve
        , reject: reject
        })
      }
    })
  }
})()

// Close connection, we don't really care if it hasn't been created yet or not
db.close = function() {
  return db.connect().then(function(conn) {
    return conn.close()
  })
}

// Small utility for running queries without having to acquire a connection
db.run = function(q, options) {
  return db.connect().then(function(conn) {
    return q.run(conn, options)
  })
}

// Sets up the database
db.setup = function() {
  return db.connect().then(function(conn) {
    return setup(conn)
  })
}
