var util = require('util')
var stream = require('stream')

var HEADER_SIZE = 4
var MAX_PACKET_SIZE = 0xFFFF

function ForwardParser() {
  stream.Transform.call(this)
  this._header = new Buffer(4)
  this._needLength = -HEADER_SIZE
  this._target = 0
}

util.inherits(ForwardParser, stream.Transform)

ForwardParser.prototype._transform = function(chunk, encoding, done) {
  var cursor = 0

  while (cursor < chunk.length) {
    var diff = chunk.length - cursor

    // Do we need a header?
    if (this._needLength < 0) {
      // Still missing a header?
      if (chunk.length < -this._needLength) {
        // Save what we're received so far.
        chunk.copy(
          this._header
        , HEADER_SIZE + this._needLength
        , cursor
        , cursor + -this._needLength
        )
        break
      }

      // Combine previous and current chunk in case the header was split.
      chunk.copy(
        this._header
      , HEADER_SIZE + this._needLength
      , cursor
      , cursor + -this._needLength
      )

      cursor += -this._needLength

      this._target = this._header.readUInt16LE(0)
      this._needLength = this._header.readUInt16LE(2)

      if (this._needLength === 0) {
        // This is a fin packet
        this.emit('fin', this._target)
        this._needLength = -HEADER_SIZE
      }
    }
    // Do we have a full data packet?
    else if (diff >= this._needLength) {
      this.emit(
        'packet'
      , this._target
      , chunk.slice(cursor, cursor + this._needLength)
      )
      cursor += this._needLength
      this._needLength = -HEADER_SIZE
    }
    // We have a partial data packet.
    else {
      this.emit('packet', this._target, chunk.slice(cursor, cursor + diff))
      this._needLength -= diff
      cursor += diff
    }
  }

  done()
}

module.exports.ForwardParser = ForwardParser

function ForwardWriter(target) {
  stream.Transform.call(this)
  this._target = target
}

util.inherits(ForwardWriter, stream.Transform)

ForwardWriter.prototype._transform = function(chunk, encoding, done) {
  var header
    , length

  do {
    length = Math.min(MAX_PACKET_SIZE, chunk.length)

    header = new Buffer(HEADER_SIZE)
    header.writeUInt16LE(this._target, 0)
    header.writeUInt16LE(length, 2)

    this.push(header)
    this.push(chunk.slice(0, length))

    chunk = chunk.slice(length)
  }
  while (chunk.length)

  done()
}

ForwardWriter.prototype._flush = function(done) {
  var header = new Buffer(HEADER_SIZE)
  header.writeUInt16LE(this._target, 0)
  header.writeUInt16LE(0, 2)

  this.push(header)

  done()
}

module.exports.ForwardWriter = ForwardWriter
