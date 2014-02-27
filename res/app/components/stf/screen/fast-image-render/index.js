// See http://jsperf.com/fastest-canvas-drawing/2
// See http://jsperf.com/canvas-drawimage-vs-putimagedata/3
// See http://jsperf.com/canvas-drawimage-vs-webgl-drawarrays


function FastImageLoader(url) {
  var that = this
  this.loader = new Image()

  if (url) {
    this.load(url)
  }

  this.loader.onload = function () {
    if (typeof(that.onLoad) === 'function') {
      that.onLoad(this)
    }
  }

  this.loader.onerror = function () {

    if (typeof(that.onError) === 'function') {
      that.onError(this)
    }
  }
}

/**
 * Loads an URL
 * @param {string} url
 */
FastImageLoader.prototype.load = function (url) {
  this.loader.src = url
}

//FastImageLoader.prototype.onload = function () {
//
//}


function CanvasRender(canvasElement, options) {
  var checkForCanvasElement = function checkForCanvasElement() {
    if (!canvasElement) {
      throw new Error('Needs a canvas element')
    }

    this.displayWidth = canvasElement.offsetWidth
    this.displayHeight = canvasElement.offsetHeight

    if (!this.displayWidth || !this.displayHeight) {
      throw new Error('Unable to get display size canvas must have dimensions')
    }
  }

  this.options = options
  this.context = canvasElement.getContext('2d')
}

CanvasRender.prototype.draw = function (image) {
  this.context.drawImage(image, 0, 0)
}

CanvasRender.prototype.clear = function () {
  this.context.clearRect(0, 0, this.displayWidth, this.displayHeight)
}


function WebGLRender(canvasElement, options) {
  var checkForCanvasElement = function checkForCanvasElement() {
    if (!canvasElement) {
      throw new Error('Needs a canvas element')
    }

    this.displayWidth = canvasElement.offsetWidth
    this.displayHeight = canvasElement.offsetHeight

    if (!this.displayWidth || !this.displayHeight) {
      throw new Error('Unable to get display size canvas must have dimensions')
    }
  }

  this.options = {
//    alpha: this.transparent,
//    antialias: !!antialias,
//    premultipliedAlpha: !!transparent,
//    stencil: true
  }

  try {
    this.ctx = canvasElement.getContext('experimental-webgl', this.options)
  } catch (e) {
    try {
      this.ctx = canvasElement.getContext('webgl', this.options)
    } catch (e2) {
      // fail, not able to get a context
      throw new Error('This browser does not support webGL. Try using the canvas renderer' + this)
    }
  }

  this.contextLost = false

//  gl.useProgram(this.shaderManager.defaultShader.program)

  //this.ctx.disable(this.ctx.DEPTH_TEST)
  //this.ctx.disable(this.ctx.CULL_FACE)

  this.setup()
}

WebGLRender.prototype.setup = function () {
  // create shaders
  var vertexShaderSrc =
    'attribute vec2 aVertex;' +
    'attribute vec2 aUV;' +
    'varying vec2 vTex;' +
    'void main(void) {' +
    '  gl_Position = vec4(aVertex, 0.0, 1.0);' +
    '  vTex = aUV;' +
    '}';

  var fragmentShaderSrc =
    'precision highp float;' +
    'varying vec2 vTex;' +
    'uniform sampler2D sampler0;' +
    'void main(void){' +
    '  gl_FragColor = texture2D(sampler0, vTex);' +
    '}';

  var vertShaderObj = this.ctx.createShader(this.ctx.VERTEX_SHADER)
  var fragShaderObj = this.ctx.createShader(this.ctx.FRAGMENT_SHADER)
  this.ctx.shaderSource(vertShaderObj, vertexShaderSrc)
  this.ctx.shaderSource(fragShaderObj, fragmentShaderSrc)
  this.ctx.compileShader(vertShaderObj)
  this.ctx.compileShader(fragShaderObj)

  var progObj = this.ctx.createProgram()
  this.ctx.attachShader(progObj, vertShaderObj)
  this.ctx.attachShader(progObj, fragShaderObj)

  this.ctx.linkProgram(progObj)
  this.ctx.useProgram(progObj)

  var width = this.displayWidth
  var height = this.displayHeight

  this.ctx.viewport(0, 0, width, height)

  this.vertexBuff = this.ctx.createBuffer()
  this.ctx.bindBuffer(this.ctx.ARRAY_BUFFER, this.vertexBuff)
  this.ctx.bufferData(
    this.ctx.ARRAY_BUFFER,
    new Float32Array([-1 / 8, 1 / 6, -1 / 8, -1 / 6, 1 / 8, -1 / 6, 1 / 8, 1 / 6]),
    this.ctx.STATIC_DRAW)

  this.texBuff = this.ctx.createBuffer()
  this.ctx.bindBuffer(this.ctx.ARRAY_BUFFER, this.texBuff)
  this.ctx.bufferData(
    this.ctx.ARRAY_BUFFER,
    new Float32Array([0, 1, 0, 0, 1, 0, 1, 1]),
    this.ctx.STATIC_DRAW)

  this.vloc = this.ctx.getAttribLocation(progObj, 'aVertex')
  this.tloc = this.ctx.getAttribLocation(progObj, 'aUV')

}

WebGLRender.prototype.draw = function (image) {
  var tex = this.ctx.createTexture()
  this.ctx.bindTexture(this.ctx.TEXTURE_2D, tex)
  this.ctx.texParameteri(this.ctx.TEXTURE_2D, this.ctx.TEXTURE_MIN_FILTER, this.ctx.NEAREST)
  this.ctx.texParameteri(this.ctx.TEXTURE_2D, this.ctx.TEXTURE_MAG_FILTER, this.ctx.NEAREST)
//  this.ctx.texParameteri(this.ctx.TEXTURE_2D, this.ctx.TEXTURE_MIN_FILTER, this.ctx.LINEAR);

//  this.ctx.texParameteri(this.ctx.TEXTURE_2D, this.ctx.TEXTURE_WRAP_S, this.ctx.CLAMP_TO_EDGE);
//  this.ctx.texParameteri(this.ctx.TEXTURE_2D, this.ctx.TEXTURE_WRAP_T, this.ctx.CLAMP_TO_EDGE);

  this.ctx.generateMipmap(this.ctx.TEXTURE_2D)
  this.ctx.texImage2D(this.ctx.TEXTURE_2D, 0, this.ctx.RGBA, this.ctx.RGBA, this.ctx.UNSIGNED_BYTE, image)

  this.ctx.enableVertexAttribArray(this.vloc)
  this.ctx.bindBuffer(this.ctx.ARRAY_BUFFER, this.vertexBuff)
  this.ctx.vertexAttribPointer(this.vloc, 2, this.ctx.FLOAT, false, 0, 0)

  this.ctx.enableVertexAttribArray(this.tloc)
  this.ctx.bindBuffer(this.ctx.ARRAY_BUFFER, this.texBuff)
  this.ctx.bindTexture(this.ctx.TEXTURE_2D, tex)
  this.ctx.vertexAttribPointer(this.tloc, 2, this.ctx.FLOAT, false, 0, 0)
}

WebGLRender.prototype.clear = function () {

}

function FastImageRender(canvasElement, options) {
  this.options = options || {}
  this.canvasElement = canvasElement


  if (this.options.render === 'webgl') {
    this.render = new WebGLRender(canvasElement, options)
  } else if (this.options.render === 'pixi') {
    this.render = new PixiRender(canvasElement, options)
  } else {
    this.render = new CanvasRender(canvasElement, options)
  }
}

FastImageRender.prototype.draw = function (image) {
  this.render.draw(image)
}

FastImageRender.prototype.clear = function () {
  this.render.clear()
}

Object.defineProperty(FastImageRender.prototype, 'canvasWidth', {
  get: function () {
    return this.canvasElement.width
  },
  set: function (width) {
    if (width) {
      if (width !== this.canvasElement.width) {
        this.canvasElement.width = width;
      }
    }
  }
})

Object.defineProperty(FastImageRender.prototype, 'canvasHeight', {
  get: function () {
    return this.canvasElement.height
  },
  set: function (height) {
    if (height) {
      if (height !== this.canvasElement.height) {
        this.canvasElement.height = height;
      }
    }
  }
})

Object.defineProperty(FastImageRender.prototype, 'displayWidth', {
  get: function () {
    return this.canvasElement.width
  },
  set: function (width) {
    if (width) {
      if (width !== this.canvasElement.width) {
        this.canvasElement.width = width;
      }
    }
  }
})

Object.defineProperty(FastImageRender.prototype, 'displayHeight', {
  get: function () {
    return this.canvasElement.height
  },
  set: function (height) {
    if (height) {
      if (height !== this.canvasElement.height) {
        this.canvasElement.height = height;
      }
    }
  }
})

Object.defineProperty(FastImageRender.prototype, 'canvasStyleWidth', {
  get: function () {
    return parseInt(this.canvasElement.style.width, 10)
  },
  set: function (width) {
    if (width) {
      var styleWidth = width + 'px'
      if (styleWidth !== this.canvasElement.style.width) {
        this.canvasElement.style.width = styleWidth;
      }
    }
  }
})

Object.defineProperty(FastImageRender.prototype, 'canvasStyleHeight', {
  get: function () {
    return parseInt(this.canvasElement.style.height, 10)
  },
  set: function (height) {
    if (height) {
      var styleHeight = height + 'px'
      if (styleHeight !== this.canvasElement.style.height) {
        this.canvasElement.style.height = height;
      }
    }
  }
})


// Check for Non CommonJS world
if (typeof module !== 'undefined') {
  module.exports = {
    FastImageRender: FastImageRender,
    FastImageLoader: FastImageLoader
  }
}
