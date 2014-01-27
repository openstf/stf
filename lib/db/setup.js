var assert = require('assert')
var util = require('util')

var r = require('rethinkdb')
var Promise = require('bluebird')

var logger = require('../util/logger')
var rutil = require('../util/rutil')
var tables = require('./tables')

module.exports = function(conn) {
  var log = logger.createLogger('db:setup')

  function createDatabase() {
    return rutil.run(conn, r.dbCreate(conn.db))
      .then(function() {
        log.info('Database "%s" created', conn.db)
      })
      .catch(rutil.errors.RqlRuntimeError, function(err) {
        var expected = util.format('Database `%s` already exists.', conn.db)
        assert.equal(expected, err.msg)
        log.info('Database "%s" already exists', conn.db)
      })
  }

  function createTable(table, options) {
    return rutil.run(conn, r.tableCreate(table, options))
      .then(function() {
        log.info('Table "%s" created', table)
        return Promise.resolve()
      })
      .catch(rutil.errors.RqlRuntimeError, function(err) {
        var expected = util.format('Table `%s` already exists.', table)
        assert.equal(expected, err.msg)
        log.info('Table "%s" already exists', table)
      })
  }

  return createDatabase()
    .then(function() {
      return Promise.all(Object.keys(tables).map(function(table) {
        return createTable(table, tables[table])
      }))
    })
    .return(conn)
}
