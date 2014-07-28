var util = require('util')
var stream = require('stream')

function DelimitedStream() {
  stream.Transform.call(this)
  this._length = 0
  this._lengthIndex = 0
  this._readingLength = true
  this._buffer = new Buffer(0)
}

util.inherits(DelimitedStream, stream.Transform)

DelimitedStream.prototype._transform = function(chunk, encoding, done) {
  this._buffer = Buffer.concat([this._buffer, chunk])

  while (this._buffer.length) {
    if (this._readingLength) {
      var byte = this._buffer[0]
      this._length += (byte & 0x7f) << (7 * this._lengthIndex)
      if (byte & (1 << 7)) {
        this._lengthIndex += 1
        this._readingLength = true
      }
      else {
        this._lengthIndex = 0
        this._readingLength = false
      }
      this._buffer = this._buffer.slice(1)
    }
    else {
      if (this._length <= this._buffer.length) {
        this.push(this._buffer.slice(0, this._length))
        this._buffer = this._buffer.slice(this._length)
        this._length = 0
        this._readingLength = true
      }
      else {
        // Wait for more chunks
        break
      }
    }
  }

  done()
}

module.exports.DelimitedStream = DelimitedStream

function DelimitingStream() {
  stream.Transform.call(this)
}

util.inherits(DelimitingStream, stream.Transform)

DelimitingStream.prototype._transform = function(chunk, encoding, done) {
  var length = chunk.length
  var lengthBytes = []

  while (length > 0x7f) {
    lengthBytes.push((1 << 7) + (length & 0x7f))
    length >>= 7
  }

  lengthBytes.push(length)

  this.push(new Buffer(lengthBytes))
  this.push(chunk)

  done()
}

module.exports.DelimitingStream = DelimitingStream
