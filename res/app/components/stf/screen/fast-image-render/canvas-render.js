function CanvasRender(canvasElement, options) {
  this.options = options
  this.context = canvasElement.getContext('2d')

  var devicePixelRatio = window.devicePixelRatio || 1

  var backingStoreRatio = this.context.webkitBackingStorePixelRatio ||
  this.context.mozBackingStorePixelRatio ||
  this.context.msBackingStorePixelRatio ||
  this.context.oBackingStorePixelRatio ||
  this.context.backingStorePixelRatio || 1

  this.frontBackRatio = devicePixelRatio / backingStoreRatio

  if (options.autoScaleForRetina && devicePixelRatio !== backingStoreRatio) {
    var oldWidth = canvasElement.width
    var oldHeight = canvasElement.height

    canvasElement.width = oldWidth * this.frontBackRatio
    canvasElement.height = oldHeight * this.frontBackRatio

    canvasElement.style.width = oldWidth + 'px'
    canvasElement.style.height = oldHeight + 'px'

    this.context.scale(this.frontBackRatio, this.frontBackRatio)
  }
}

CanvasRender.prototype.draw = function(image) {
  this.context.drawImage(image, 0, 0)
}

CanvasRender.prototype.clear = function() {
  this.context.clearRect(0, 0, this.context.canvas.width,
    this.context.canvas.height)
}

// Check for Non CommonJS world
if (typeof module !== 'undefined') {
  module.exports = {
    CanvasRender: CanvasRender
  }
}
