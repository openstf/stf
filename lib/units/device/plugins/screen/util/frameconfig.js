var util = require('util')

function FrameConfig(real, virtual) {
  this.realWidth = real.width
  this.realHeight = real.height
  this.virtualWidth = virtual.width
  this.virtualHeight = virtual.height
  this.rotation = virtual.rotation
}

FrameConfig.prototype.toString = function() {
  return util.format(
    '%dx%d@%dx%d/%d'
  , this.realWidth
  , this.realHeight
  , this.virtualWidth
  , this.virtualHeight
  , this.rotation
  )
}

module.exports = FrameConfig
