function CanvasRender(canvasElement, options) {
  this.options = options
  this.context = canvasElement.getContext('2d')
}

CanvasRender.prototype.draw = function (image) {
  this.context.drawImage(image, 0, 0)
}

CanvasRender.prototype.clear = function () {
  this.context.clearRect(0, 0, this.context.canvas.width,
    this.context.canvas.height)
}

// Check for Non CommonJS world
if (typeof module !== 'undefined') {
  module.exports = {
    CanvasRender: CanvasRender
  }
}
