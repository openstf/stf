var stream = require('stream')
var util = require('util')

function FrameParser() {
  this.readFrameBytes = 0
  this.frameBodyLength = 0
  this.frameBody = new Buffer(0)
  stream.Transform.call(this)
}

util.inherits(FrameParser, stream.Transform)

FrameParser.prototype._transform = function(chunk, encoding, done) {
  var cursor, len, bytesLeft

  for (cursor = 0, len = chunk.length; cursor < len;) {
    if (this.readFrameBytes < 4) {
      this.frameBodyLength +=
        (chunk[cursor] << (this.readFrameBytes * 8)) >>> 0
      cursor += 1
      this.readFrameBytes += 1
    }
    else {
      bytesLeft = len - cursor

      if (bytesLeft >= this.frameBodyLength) {
        this.frameBody = Buffer.concat([
          this.frameBody
        , chunk.slice(cursor, cursor + this.frameBodyLength)
        ])

        this.push(this.frameBody)

        cursor += this.frameBodyLength
        this.frameBodyLength = this.readFrameBytes = 0
        this.frameBody = new Buffer(0)
      }
      else {
        // @todo Consider/benchmark continuation frames to prevent
        // potential Buffer thrashing.
        this.frameBody = Buffer.concat([
          this.frameBody
        , chunk.slice(cursor, len)
        ])

        this.frameBodyLength -= bytesLeft
        this.readFrameBytes += bytesLeft
        cursor = len
      }
    }
  }

  return done()
}

module.exports = FrameParser
