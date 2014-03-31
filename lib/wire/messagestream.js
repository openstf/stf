var util = require('util')
var stream = require('stream')

function MessageStream() {
  stream.Transform.call(this)
  this._length = 0
  this._lengthIndex = 0
  this._readingLength = true
  this._buffer = new Buffer(0)
}

util.inherits(MessageStream, stream.Transform)

MessageStream.prototype._transform = function(chunk, encoding, done) {
  this._buffer = Buffer.concat([this._buffer, chunk])

  var lo = 0
  var hi = this._buffer.length

  while (lo < hi) {
    if (this._readingLength) {
      while (lo < hi) {
        var byte = this._buffer[lo++]
        if (byte & (1 << 7)) {
          this._length += (byte & 0x7f) << (7 * this._lengthIndex)
          this._lengthIndex += 1
          this._readingLength = true
        }
        else {
          this._length += (byte & 0x7f) << (7 * this._lengthIndex)
          this._lengthIndex = 0
          this._readingLength = false
          break
        }
      }
    }

    if (!this._readingLength && lo + this._length <= hi) {
      this.push(chunk.slice(lo, lo + this._length))
      lo += this._length
      this._length = 0
      this._readingLength = true
    }
    else {
      break
    }
  }

  done()
}

module.exports = MessageStream
