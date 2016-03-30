/*
 Based on http://www-cs-students.stanford.edu/~eparker/files/crunch/renderer.js
 */

/*global Float32Array */

/**
 * Constructs a renderer object.
 * @param {WebGLRenderingContext} gl The GL context.
 * @constructor
 */
var Renderer = function(gl) {
  /**
   * The GL context.
   * @type {WebGLRenderingContext}
   * @private
   */
  this.gl_ = gl

  /**
   * The WebGLProgram.
   * @type {WebGLProgram}
   * @private
   */
  this.program_ = gl.createProgram()

  /**
   * @type {WebGLShader}
   * @private
   */
  this.vertexShader_ = this.compileShader_(
    Renderer.vertexShaderSource_, gl.VERTEX_SHADER)

  /**
   * @type {WebGLShader}
   * @private
   */
  this.fragmentShader_ = this.compileShader_(
    Renderer.fragmentShaderSource_, gl.FRAGMENT_SHADER)

  /**
   * Cached uniform locations.
   * @type {Object.<string, WebGLUniformLocation>}
   * @private
   */
  this.uniformLocations_ = {}

  /**
   * Cached attribute locations.
   * @type {Object.<string, WebGLActiveInfo>}
   * @private
   */
  this.attribLocations_ = {}

  /**
   * A vertex buffer containing a single quad with xy coordinates from [-1,-1]
   * to [1,1] and uv coordinates from [0,0] to [1,1].
   * @private
   */
  this.quadVertexBuffer_ = gl.createBuffer()
  gl.bindBuffer(gl.ARRAY_BUFFER, this.quadVertexBuffer_)
  var vertices = new Float32Array(
    [-1.0, -1.0, 0.0, 1.0,
      +1.0, -1.0, 1.0, 1.0,
      -1.0, +1.0, 0.0, 0.0,
      1.0, +1.0, 1.0, 0.0])
  gl.bufferData(gl.ARRAY_BUFFER, vertices, gl.STATIC_DRAW)


  // Init shaders
  gl.attachShader(this.program_, this.vertexShader_)
  gl.attachShader(this.program_, this.fragmentShader_)
  gl.bindAttribLocation(this.program_, 0, 'vert')
  gl.linkProgram(this.program_)
  gl.useProgram(this.program_)
  gl.enableVertexAttribArray(0)

  gl.enable(gl.DEPTH_TEST)
  gl.disable(gl.CULL_FACE)

  var count = gl.getProgramParameter(this.program_, gl.ACTIVE_UNIFORMS)
  for (var i = 0; i < /** @type {number} */(count); i++) {
    var infoU = gl.getActiveUniform(this.program_, i)
    this.uniformLocations_[infoU.name] =
      gl.getUniformLocation(this.program_, infoU.name)
  }

  count = gl.getProgramParameter(this.program_, gl.ACTIVE_ATTRIBUTES)
  for (var j = 0; j < /** @type {number} */(count); j++) {
    var infoA = gl.getActiveAttrib(this.program_, j)
    this.attribLocations_[infoA.name] =
      gl.getAttribLocation(this.program_, infoA.name)
  }
}


Renderer.prototype.finishInit = function() {
  this.draw()
}


Renderer.prototype.createDxtTexture =
  function(dxtData, width, height, format) {
    var gl = this.gl_
    var tex = gl.createTexture()
    gl.bindTexture(gl.TEXTURE_2D, tex)
    gl.compressedTexImage2D(
      gl.TEXTURE_2D,
      0,
      format,
      width,
      height,
      0,
      dxtData)
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.LINEAR)
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR)
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE)
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE)
    //gl.generateMipmap(gl.TEXTURE_2D)
    gl.bindTexture(gl.TEXTURE_2D, null)
    return tex
  }


Renderer.prototype.createRgb565Texture = function(rgb565Data, width, height) {
  var gl = this.gl_
  var tex = gl.createTexture()
  gl.bindTexture(gl.TEXTURE_2D, tex)
  gl.texImage2D(
    gl.TEXTURE_2D,
    0,
    gl.RGB,
    width,
    height,
    0,
    gl.RGB,
    gl.UNSIGNED_SHORT_5_6_5,
    rgb565Data)
  gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.LINEAR)
  gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR)
  gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE)
  gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE)
  //gl.generateMipmap(gl.TEXTURE_2D)
  gl.bindTexture(gl.TEXTURE_2D, null)
  return tex
}


Renderer.prototype.drawTexture = function(texture, width, height) {
  var gl = this.gl_
  // draw scene
  gl.clearColor(0, 0, 0, 1)
  gl.clearDepth(1.0)
  gl.viewport(0, 0, width, height)
  gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT | gl.STENCIL_BUFFER_BIT)

  gl.activeTexture(gl.TEXTURE0)
  gl.bindTexture(gl.TEXTURE_2D, texture)
  gl.uniform1i(this.uniformLocations_.texSampler, 0)

  gl.enableVertexAttribArray(this.attribLocations_.vert)
  gl.bindBuffer(gl.ARRAY_BUFFER, this.quadVertexBuffer_)
  gl.vertexAttribPointer(this.attribLocations_.vert, 4, gl.FLOAT,
    false, 0, 0)
  gl.drawArrays(gl.TRIANGLE_STRIP, 0, 4)
}


/**
 * Compiles a GLSL shader and returns a WebGLShader.
 * @param {string} shaderSource The shader source code string.
 * @param {number} type Either VERTEX_SHADER or FRAGMENT_SHADER.
 * @return {WebGLShader} The new WebGLShader.
 * @private
 */
Renderer.prototype.compileShader_ = function(shaderSource, type) {
  var gl = this.gl_
  var shader = gl.createShader(type)
  gl.shaderSource(shader, shaderSource)
  gl.compileShader(shader)
  return shader
}


/**
 * @type {string}
 * @private
 */
Renderer.vertexShaderSource_ = [
  'attribute vec4 vert;',
  'varying vec2 v_texCoord;',
  'void main() {',
  '  gl_Position = vec4(vert.xy, 0.0, 1.0);',
  '  v_texCoord = vert.zw;',
  '}'
].join('\n')


/**
 * @type {string}
 * @private
 */
Renderer.fragmentShaderSource_ = [
  'precision highp float;',
  'uniform sampler2D texSampler;',
  'varying vec2 v_texCoord;',
  'void main() {',
  '  gl_FragColor = texture2D(texSampler, v_texCoord);',
  '}'
].join('\n')

// -------------------------------------------------------------------------------------------------


function WebGLRender(canvasElement) {
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
      throw new Error('This browser does not support webGL. Try using the' +
      'canvas renderer' + this)
    }
  }

  if (!this.ctx.getExtension('WEBKIT_WEBGL_compressed_texture_s3tc')) {
    this.dxtSupported = false
  }

  this.renderer = new Renderer(this.ctx)


  this.contextLost = false

//  gl.useProgram(this.shaderManager.defaultShader.program)

  //this.ctx.disable(this.ctx.DEPTH_TEST)
  //this.ctx.disable(this.ctx.CULL_FACE)

  //this.setup()
}

WebGLRender.prototype.setup = function() {
  // create shaders
  var vertexShaderSrc =
    'attribute vec2 aVertex;' +
    'attribute vec2 aUV;' +
    'varying vec2 vTex;' +
    'void main(void) {' +
    '  gl_Position = vec4(aVertex, 0.0, 1.0);' +
    '  vTex = aUV;' +
    '}'

  var fragmentShaderSrc =
    'precision highp float;' +
    'varying vec2 vTex;' +
    'uniform sampler2D sampler0;' +
    'void main(void){' +
    '  gl_FragColor = texture2D(sampler0, vTex);' +
    '}'

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
    this.ctx.ARRAY_BUFFER, new Float32Array([
      -1 / 8, 1 / 6, -1 / 8, -1 / 6, 1 / 8, -1 / 6, 1 / 8, 1 / 6
    ]), this.ctx.STATIC_DRAW
  )

  this.texBuff = this.ctx.createBuffer()
  this.ctx.bindBuffer(this.ctx.ARRAY_BUFFER, this.texBuff)
  this.ctx.bufferData(
    this.ctx.ARRAY_BUFFER,
    new Float32Array([0, 1, 0, 0, 1, 0, 1, 1]),
    this.ctx.STATIC_DRAW)

  this.vloc = this.ctx.getAttribLocation(progObj, 'aVertex')
  this.tloc = this.ctx.getAttribLocation(progObj, 'aUV')

}

WebGLRender.prototype.draw = function(image) {
//  this.renderer.drawTexture(image, image.width, image.height)
  this.renderer.drawTexture(image, 643, 1149)
}


WebGLRender.prototype.drawOld = function(image) {
  var tex = this.ctx.createTexture()
  this.ctx.bindTexture(this.ctx.TEXTURE_2D, tex)
  this.ctx.texParameteri(
    this.ctx.TEXTURE_2D, this.ctx.TEXTURE_MIN_FILTER, this.ctx.NEAREST
  )
  this.ctx.texParameteri(
    this.ctx.TEXTURE_2D, this.ctx.TEXTURE_MAG_FILTER, this.ctx.NEAREST
  )
  /*
   this.ctx.texParameteri(
   this.ctx.TEXTURE_2D
   , this.ctx.TEXTURE_MIN_FILTER
   , this.ctx.LINEAR
   )

   this.ctx.texParameteri(
   this.ctx.TEXTURE_2D
   , this.ctx.TEXTURE_WRAP_S
   , this.ctx.CLAMP_TO_EDGE
   )
   this.ctx.texParameteri(
   this.ctx.TEXTURE_2D
   , this.ctx.TEXTURE_WRAP_T
   , this.ctx.CLAMP_TO_EDGE
   )
   */
  this.ctx.generateMipmap(this.ctx.TEXTURE_2D)
  this.ctx.texImage2D(
    this.ctx.TEXTURE_2D, 0, this.ctx.RGBA, this.ctx.RGBA,
    this.ctx.UNSIGNED_BYTE, image
  )

  this.ctx.enableVertexAttribArray(this.vloc)
  this.ctx.bindBuffer(this.ctx.ARRAY_BUFFER, this.vertexBuff)
  this.ctx.vertexAttribPointer(this.vloc, 2, this.ctx.FLOAT, false, 0, 0)

  this.ctx.enableVertexAttribArray(this.tloc)
  this.ctx.bindBuffer(this.ctx.ARRAY_BUFFER, this.texBuff)
  this.ctx.bindTexture(this.ctx.TEXTURE_2D, tex)
  this.ctx.vertexAttribPointer(this.tloc, 2, this.ctx.FLOAT, false, 0, 0)
}

WebGLRender.prototype.clear = function() {

}


// Check for Non CommonJS world
if (typeof module !== 'undefined') {
  module.exports = {
    WebGLRender: WebGLRender
  }
}
