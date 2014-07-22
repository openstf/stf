var r = require('rethinkdb')
var Promise = require('bluebird')

var logger = require('../util/logger')
var tables = require('./tables')

module.exports = function(conn) {
  var log = logger.createLogger('db:setup')

  function alreadyExistsError(err) {
    return err.msg && err.msg.indexOf('already exists') !== -1
  }

  function noMasterAvailableError(err) {
    return err.msg && err.msg.indexOf('No master available') !== -1
  }

  function createDatabase() {
    return r.dbCreate(conn.db).run(conn)
      .then(function() {
        log.info('Database "%s" created', conn.db)
      })
      .catch(alreadyExistsError, function() {
        log.info('Database "%s" already exists', conn.db)
        return Promise.resolve()
      })
  }

  function createTable(table, options) {
    var tableOptions = {
      primaryKey: options.primaryKey
    }
    return r.tableCreate(table, tableOptions).run(conn)
      .then(function() {
        log.info('Table "%s" created', table)
      })
      .catch(alreadyExistsError, function() {
        log.info('Table "%s" already exists', table)
        return Promise.resolve()
      })
      .catch(noMasterAvailableError, function() {
        return Promise.delay(1000).then(function() {
          return createTable(table, options)
        })
      })
      .then(function() {
        if (options.indexes) {
          return Promise.all(Object.keys(options.indexes).map(function(index) {
            return createIndex(table, index, options.indexes[index])
          }))
        }
      })
  }

  function createIndex(table, index, fn) {
    return r.table(table).indexCreate(index, fn).run(conn)
      .then(function() {
        log.info('Index "%s"."%s" created', table, index)
      })
      .catch(alreadyExistsError, function() {
        log.info('Index "%s"."%s" already exists', table, index)
        return Promise.resolve()
      })
      .catch(noMasterAvailableError, function() {
        return Promise.delay(1000).then(function() {
          return createIndex(table, index, fn)
        })
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
