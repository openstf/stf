function PixelFormat(values) {
  this.bitsPerPixel = values.bitsPerPixel
  this.depth = values.depth
  this.bigEndianFlag = values.bigEndianFlag
  this.trueColorFlag = values.trueColorFlag
  this.redMax = values.redMax
  this.greenMax = values.greenMax
  this.blueMax = values.blueMax
  this.redShift = values.redShift
  this.greenShift = values.greenShift
  this.blueShift = values.blueShift
}

module.exports = PixelFormat
