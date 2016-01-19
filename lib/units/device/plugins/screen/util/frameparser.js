function FrameParser() {
  this.readFrameBytes = 0
  this.frameBodyLength = 0
  this.frameBody = null
  this.cursor = 0
  this.chunk = null
}

FrameParser.prototype.push = function(chunk) {
  if (this.chunk) {
    throw new Error('Must consume pending frames before pushing more chunks')
  }

  this.chunk = chunk
}

FrameParser.prototype.nextFrame = function() {
  if (!this.chunk) {
    return null
  }

  for (var len = this.chunk.length; this.cursor < len;) {
    if (this.readFrameBytes < 4) {
      this.frameBodyLength +=
        (this.chunk[this.cursor] << (this.readFrameBytes * 8)) >>> 0
      this.cursor += 1
      this.readFrameBytes += 1
    }
    else {
      var bytesLeft = len - this.cursor

      if (bytesLeft >= this.frameBodyLength) {
        var completeBody
        if (this.frameBody) {
          completeBody = Buffer.concat([
            this.frameBody
            , this.chunk.slice(this.cursor, this.cursor + this.frameBodyLength)
          ])
        }
        else {
          completeBody = this.chunk.slice(this.cursor,
            this.cursor + this.frameBodyLength)
        }

        this.cursor += this.frameBodyLength
        this.frameBodyLength = this.readFrameBytes = 0
        this.frameBody = null

        return completeBody
      }
      else {
        // @todo Consider/benchmark continuation frames to prevent
        // potential Buffer thrashing.
        if (this.frameBody) {
          this.frameBody =
            Buffer.concat([this.frameBody, this.chunk.slice(this.cursor, len)])
        }
        else {
          this.frameBody = this.chunk.slice(this.cursor, len)
        }

        this.frameBodyLength -= bytesLeft
        this.readFrameBytes += bytesLeft
        this.cursor = len
      }
    }
  }

  this.cursor = 0
  this.chunk = null

  return null
}

module.exports = FrameParser
