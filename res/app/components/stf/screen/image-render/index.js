var canvasRender = require('./canvas')
var webGLRender = require('./webgl')
var canvasElement;

function ImageRender(options) {
  this.options = options
  this.render = new canvasRender();
}

ImageRender.prototype.draw = function (image) {
  this.render.draw(image)
}

ImageRender.prototype.clear = function () {
  this.render.clear()
}

module.exports = ImageRender