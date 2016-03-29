// See http://jsperf.com/fastest-canvas-drawing/2
// See http://jsperf.com/canvas-drawimage-vs-putimagedata/3
// See http://jsperf.com/canvas-drawimage-vs-webgl-drawarrays

function FastImageRender(canvasElement, options) {
  var that = this
  this.options = options || {}
  this.canvasElement = canvasElement
  this.timeoutId = null

  if (that.options.raf) {
    that.animLoop = function() {
      that.raf = window.requireAnimationFrame(that.animLoop)

      // separate render from drawing
      // render
    }
  }

  // Loader
  this.loader = new Image()
  this.loader.onload = function() {
    if (that.options.timeout) {
      clearTimeout(that.timeoutId)
    }
    if (typeof (that.onLoad) === 'function') {
      that.onLoad(this)
    }
  }
  this.loader.onerror = function() {
    if (that.options.timeout) {
      clearTimeout(that.timeoutId)
    }
    if (typeof (that.onError) === 'function') {
      that.onError(this)
    }
  }

  if (this.options.render === 'webgl') {
    var WebGLRender = require('./webgl-render').WebGLRender
    this.render = new WebGLRender(canvasElement, options)
  } else {
    var CanvasRender = require('./canvas-render').CanvasRender
    this.render = new CanvasRender(canvasElement, options)
  }


}

FastImageRender.prototype.destroy = function() {

  window.cancelAnimationFrame(this.raf)

  // delete onLoad & onError
}

FastImageRender.prototype.load = function(url, type) {
  var that = this

  if (that.options.timeout) {
    that.timeoutId = setTimeout(function() {
      if (typeof (that.onError) === 'function') {
        that.onError('timeout')
      }
    }, that.options.timeout)
  }

  if (this.options.textureLoader) {
    if (!this.textureLoader) {
      this.textureLoader = new window.TextureUtil.TextureLoader(this.render.ctx)
    }
    var texture = null
    if (type) {
      texture = this.render.ctx.createTexture()
      this.textureLoader.loadEx(url, texture, true, function() {
        if (typeof (that.onLoad) === 'function') {
          that.onLoad(texture)
        }
      }, type)
    } else {
      this.textureLoader.load(url, function(texture) {
        if (typeof (that.onLoad) === 'function') {
          that.onLoad(texture)
        }
      })
    }

  } else {

    this.loader.src = url
  }
}

FastImageRender.prototype.draw = function(image) {
  this.render.draw(image)
}

FastImageRender.prototype.clear = function() {
  this.render.clear()
}

Object.defineProperty(FastImageRender.prototype, 'canvasWidth', {
  get: function() {
    return this.canvasElement.width
  },
  set: function(width) {
    if (width) {
      if (width !== this.canvasElement.width) {
        this.canvasElement.width = width
      }
    }
  }
})

Object.defineProperty(FastImageRender.prototype, 'canvasHeight', {
  get: function() {
    return this.canvasElement.height
  },
  set: function(height) {
    if (height) {
      if (height !== this.canvasElement.height) {
        this.canvasElement.height = height
      }
    }
  }
})

Object.defineProperty(FastImageRender.prototype, 'displayWidth', {
  get: function() {
    return this.canvasElement.width
  },
  set: function(width) {
    if (width) {
      if (width !== this.canvasElement.width) {
        this.canvasElement.width = width
      }
    }
  }
})

Object.defineProperty(FastImageRender.prototype, 'displayHeight', {
  get: function() {
    return this.canvasElement.height
  },
  set: function(height) {
    if (height) {
      if (height !== this.canvasElement.height) {
        this.canvasElement.height = height
      }
    }
  }
})

Object.defineProperty(FastImageRender.prototype, 'canvasStyleWidth', {
  get: function() {
    return parseInt(this.canvasElement.style.width, 10)
  },
  set: function(width) {
    if (width) {
      var styleWidth = width + 'px'
      if (styleWidth !== this.canvasElement.style.width) {
        this.canvasElement.style.width = styleWidth
      }
    }
  }
})

Object.defineProperty(FastImageRender.prototype, 'canvasStyleHeight', {
  get: function() {
    return parseInt(this.canvasElement.style.height, 10)
  },
  set: function(height) {
    if (height) {
      var styleHeight = height + 'px'
      if (styleHeight !== this.canvasElement.style.height) {
        this.canvasElement.style.height = height
      }
    }
  }
})


// -------------------------------------------------------------------------------------------------


// Check for Non CommonJS world
if (typeof module !== 'undefined') {
  module.exports = {
    FastImageRender: FastImageRender
  }
}
