var r = require('rethinkdb')
var re = require('rethinkdb/errors')
var Promise = require('bluebird')

module.exports.errors = re

module.exports.connect = function(options) {
  var resolver = Promise.defer()
  r.connect(options, resolver.callback)
  return resolver.promise
}

module.exports.run = function(conn, q) {
  var resolver = Promise.defer()
  q.run(conn, resolver.callback)
  return resolver.promise
}
