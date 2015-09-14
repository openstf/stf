var net = require('net')
var util = require('util')

var EventEmitter = require('eventemitter3').EventEmitter
var debug = require('debug')('vnc:server')

var VncConnection = require('./connection')

function VncServer(server) {
  this._bound = {
    _connectionListener: this._connectionListener.bind(this)
  }

  this.server = server
    .on('connection', this._bound._connectionListener)
}

util.inherits(VncServer, EventEmitter)

VncServer.prototype._connectionListener = function(conn) {
  debug('connection', conn.remoteAddress, conn.remotePort)
  new VncConnection(conn)
}

module.exports = VncServer
