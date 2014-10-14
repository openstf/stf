var util = require('util')
var events = require('events')
var net = require('net')

var ForwardReader = require('./reader')
var ForwardWriter = require('./writer')

// Handles multiple ports
function ForwardManager() {
  var handlersByPort = Object.create(null)

  this.has = function(port) {
    return !!handlersByPort[port]
  }

  this.add = function(port, conn, to) {
    function endListener() {
      delete handlersByPort[port]
      this.emit('remove', port, to)
    }

    var handler = new ForwardHandler(conn, to)
    handler.on('end', endListener.bind(this))

    handlersByPort[port] = handler

    this.emit('add', port, to)
  }

  this.remove = function(port) {
    var handler = handlersByPort[port]
    if (handler) {
      handler.end()
    }
  }

  this.removeAll = function() {
    Object.keys(handlersByPort).forEach(function(port) {
      handlersByPort[port].end()
    })
  }

  this.listAll = function() {
    return Object.keys(handlersByPort).map(function(port) {
      var handler = handlersByPort[port]
      return {
        port: port
      , to: handler.to
      }
    })
  }

  events.EventEmitter.call(this)
}

util.inherits(ForwardManager, events.EventEmitter)

// Handles a single port
function ForwardHandler(conn, to) {
  var destHandlersById = Object.create(null)

  function endListener() {
    this.emit('end')
  }

  function packetEndListener(id) {
    delete destHandlersById[id]
  }

  function packetListener(id, packet) {
    var dest = destHandlersById[id]

    if (packet) {
      if (!dest) {
        // Let's create a new connection
        dest = destHandlersById[id] = new DestHandler(id, conn, to)
        dest.on('end', packetEndListener.bind(null, id))
      }

      dest.write(packet)
    }
    else {
      // It's a simulated fin packet
      if (dest) {
        dest.end()
      }
    }
  }

  conn.pipe(new ForwardReader())
    .on('end', endListener.bind(this))
    .on('packet', packetListener)

  this.to = to

  this.end = function() {
    conn.end()
  }

  events.EventEmitter.call(this)
}

util.inherits(ForwardHandler, events.EventEmitter)

// Handles a single connection
function DestHandler(id, conn, to) {
  function endListener() {
    conn.removeListener('drain', drainListener)
    this.emit('end')
  }

  function errorListener() {
    writer.end()
  }

  function readableListener() {
    maybePipeManually()
  }

  function drainListener() {
    maybePipeManually()
  }

  // We can't just pipe to conn because we don't want to end it
  // when the dest closes. Instead we'll send a special packet
  // to it (which is handled by the writer).
  function maybePipeManually() {
    var chunk
    while ((chunk = writer.read())) {
      if (!conn.write(chunk)) {
        break
      }
    }
  }

  var dest = net.connect(to)
    .on('error', errorListener)

  var writer = dest.pipe(new ForwardWriter(id))
    .on('end', endListener.bind(this))
    .on('readable', readableListener)

  conn.on('drain', drainListener)

  this.end = function() {
    dest.end()
  }

  this.write = function(chunk) {
    dest.write(chunk)
  }

  events.EventEmitter.call(this)
}

util.inherits(DestHandler, events.EventEmitter)

module.exports = ForwardManager
