function CanvasRender(options, canvasElement) {
  this.options = options
  this.context = canvasElement.getContext('2d')
}

CanvasRender.prototype.draw = function (image) {
  this.context.drawImage(image, 0, 0)
}

CanvasRender.prototype.clear = function () {
  var width = 300
  var height = 300
  ctx.clearRect(0, 0, width, height)
}

module.exports = CanvasRender
