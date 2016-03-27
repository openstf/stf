var util = require('util')
var events = require('events')
var net = require('net')

var ForwardReader = require('./reader')
var ForwardWriter = require('./writer')

// Handles a single connection
function DestHandler(id, conn, options) {
  var dest = net.connect({
      host: options.targetHost
      , port: options.targetPort
    })

  var writer = dest.pipe(new ForwardWriter(id))

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

  function readableListener() {
    maybePipeManually()
  }

  function drainListener() {
    maybePipeManually()
  }

  function endListener() {
    conn.removeListener('drain', drainListener)
    writer.removeListener('readable', readableListener)
    this.emit('end')
  }

  function errorListener() {
    writer.end()
  }

  writer.on('end', endListener.bind(this))
  writer.on('readable', readableListener)
  dest.on('error', errorListener)
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

// Handles a single port
function ForwardHandler(conn, options) {
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
        dest = destHandlersById[id] = new DestHandler(id, conn, options)
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

  function readableListener() {
    // No-op but must exist so that we get the 'end' event.
  }

  conn.pipe(new ForwardReader())
    .on('end', endListener.bind(this))
    .on('packet', packetListener)
    .on('readable', readableListener)

  this.options = options

  this.end = function() {
    conn.end()
  }

  events.EventEmitter.call(this)
}

util.inherits(ForwardHandler, events.EventEmitter)

// Handles multiple ports
function ForwardManager() {
  var handlersById = Object.create(null)

  this.has = function(id) {
    return !!handlersById[id]
  }

  this.add = function(id, conn, options) {
    function endListener() {
      delete handlersById[id]
      this.emit('remove', id, options)
    }

    if (this.has(id)) {
      this.remove(id)
    }

    var handler = new ForwardHandler(conn, options)
    handler.on('end', endListener.bind(this))

    handlersById[id] = handler

    this.emit('add', id, options)
  }

  this.remove = function(id) {
    var handler = handlersById[id]
    if (handler) {
      handler.end()
    }
  }

  this.removeAll = function() {
    Object.keys(handlersById).forEach(function(id) {
      handlersById[id].end()
    })
  }

  this.listAll = function() {
    return Object.keys(handlersById).map(function(id) {
      var handler = handlersById[id]
      return {
        id: id
      , devicePort: handler.options.devicePort
      , targetHost: handler.options.targetHost
      , targetPort: handler.options.targetPort
      }
    })
  }

  events.EventEmitter.call(this)
}

util.inherits(ForwardManager, events.EventEmitter)

module.exports = ForwardManager
