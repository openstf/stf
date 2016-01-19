var util = require('util')
var os = require('os')
var crypto = require('crypto')

var EventEmitter = require('eventemitter3').EventEmitter
var debug = require('debug')('vnc:connection')
var Promise = require('bluebird')

var PixelFormat = require('./pixelformat')

function VncConnection(conn, options) {
  this.options = options

  this._bound = {
    _errorListener: this._errorListener.bind(this)
  , _readableListener: this._readableListener.bind(this)
  , _endListener: this._endListener.bind(this)
  , _closeListener: this._closeListener.bind(this)
  }

  this._buffer = null
  this._state = 0
  this._changeState(VncConnection.STATE_NEED_CLIENT_VERSION)

  this._serverVersion = VncConnection.V3_008
  this._serverSupportedSecurity = this.options.security
  this._serverSupportedSecurityByType =
    this.options.security.reduce(
      function(map, method) {
        map[method.type] = method
        return map
      }
    , Object.create(null)
  )
  this._serverWidth = this.options.width
  this._serverHeight = this.options.height
  this._serverPixelFormat = new PixelFormat({
    bitsPerPixel: 32
  , depth: 24
  , bigEndianFlag: os.endianness() === 'BE' ? 1 : 0
  , trueColorFlag: 1
  , redMax: 255
  , greenMax: 255
  , blueMax: 255
  , redShift: 16
  , greenShift: 8
  , blueShift: 0
  })
  this._serverName = this.options.name

  this._clientVersion = null
  this._clientShare = false
  this._clientPixelFormat = this._serverPixelFormat
  this._clientEncodingCount = 0
  this._clientEncodings = []
  this._clientCutTextLength = 0

  this._authChallenge = this.options.challenge || crypto.randomBytes(16)

  this.conn = conn
    .on('error', this._bound._errorListener)
    .on('readable', this._bound._readableListener)
    .on('end', this._bound._endListener)
    .on('close', this._bound._closeListener)

  this._blockingOps = []

  this._writeServerVersion()
  this._read()
}

util.inherits(VncConnection, EventEmitter)

VncConnection.V3_003 = 3003
VncConnection.V3_007 = 3007
VncConnection.V3_008 = 3008

VncConnection.SECURITY_NONE = 1
VncConnection.SECURITY_VNC = 2

VncConnection.SECURITYRESULT_OK = 0
VncConnection.SECURITYRESULT_FAIL = 1

VncConnection.CLIENT_MESSAGE_SETPIXELFORMAT = 0
VncConnection.CLIENT_MESSAGE_SETENCODINGS = 2
VncConnection.CLIENT_MESSAGE_FBUPDATEREQUEST = 3
VncConnection.CLIENT_MESSAGE_KEYEVENT = 4
VncConnection.CLIENT_MESSAGE_POINTEREVENT = 5
VncConnection.CLIENT_MESSAGE_CLIENTCUTTEXT = 6

VncConnection.SERVER_MESSAGE_FBUPDATE = 0

var StateReverse = Object.create(null)
var State = {
  STATE_NEED_CLIENT_VERSION: 10
, STATE_NEED_CLIENT_SECURITY: 20
, STATE_NEED_CLIENT_INIT: 30
, STATE_NEED_CLIENT_VNC_AUTH: 31
, STATE_NEED_CLIENT_MESSAGE: 40
, STATE_NEED_CLIENT_MESSAGE_SETPIXELFORMAT: 50
, STATE_NEED_CLIENT_MESSAGE_SETENCODINGS: 60
, STATE_NEED_CLIENT_MESSAGE_SETENCODINGS_VALUE: 61
, STATE_NEED_CLIENT_MESSAGE_FBUPDATEREQUEST: 70
, STATE_NEED_CLIENT_MESSAGE_KEYEVENT: 80
, STATE_NEED_CLIENT_MESSAGE_POINTEREVENT: 90
, STATE_NEED_CLIENT_MESSAGE_CLIENTCUTTEXT: 100
, STATE_NEED_CLIENT_MESSAGE_CLIENTCUTTEXT_VALUE: 101
}

VncConnection.ENCODING_RAW = 0
VncConnection.ENCODING_DESKTOPSIZE = -223

Object.keys(State).map(function(name) {
  VncConnection[name] = State[name]
  StateReverse[State[name]] = name
})

VncConnection.prototype.end = function() {
  this.conn.end()
}

VncConnection.prototype.writeFramebufferUpdate = function(rectangles) {
  var chunk = new Buffer(4)
  chunk[0] = VncConnection.SERVER_MESSAGE_FBUPDATE
  chunk[1] = 0
  chunk.writeUInt16BE(rectangles.length, 2)
  this._write(chunk)

  rectangles.forEach(function(rect) {
    var rchunk = new Buffer(12)
    rchunk.writeUInt16BE(rect.xPosition, 0)
    rchunk.writeUInt16BE(rect.yPosition, 2)
    rchunk.writeUInt16BE(rect.width, 4)
    rchunk.writeUInt16BE(rect.height, 6)
    rchunk.writeInt32BE(rect.encodingType, 8)
    this._write(rchunk)

    switch (rect.encodingType) {
    case VncConnection.ENCODING_RAW:
      this._write(rect.data)
      break
    case VncConnection.ENCODING_DESKTOPSIZE:
      this._serverWidth = rect.width
      this._serverHeight = rect.height
      break
    default:
      throw new Error(util.format(
        'Unsupported encoding type', rect.encodingType))
    }
  }, this)
}

VncConnection.prototype._error = function(err) {
  this.emit('error', err)
  this.end()
}

VncConnection.prototype._errorListener = function(err) {
  this._error(err)
}

VncConnection.prototype._endListener = function() {
  this.emit('end')
}

VncConnection.prototype._closeListener = function() {
  this.emit('close')
}

VncConnection.prototype._writeServerVersion = function() {
  // Yes, we could just format the string instead. Didn't feel like it.
  switch (this._serverVersion) {
  case VncConnection.V3_003:
    this._write(new Buffer('RFB 003.003\n'))
    break
  case VncConnection.V3_007:
    this._write(new Buffer('RFB 003.007\n'))
    break
  case VncConnection.V3_008:
    this._write(new Buffer('RFB 003.008\n'))
    break
  }
}

VncConnection.prototype._writeSupportedSecurity = function() {
  var chunk = new Buffer(1 + this._serverSupportedSecurity.length)

  chunk[0] = this._serverSupportedSecurity.length
  this._serverSupportedSecurity.forEach(function(security, i) {
    chunk[1 + i] = security.type
  })

  this._write(chunk)
}

VncConnection.prototype._writeSecurityResult = function(result, reason) {
  var chunk
  switch (result) {
  case VncConnection.SECURITYRESULT_OK:
    chunk = new Buffer(4)
    chunk.writeUInt32BE(result, 0)
    this._write(chunk)
    break
  case VncConnection.SECURITYRESULT_FAIL:
    chunk = new Buffer(4 + 4 + reason.length)
    chunk.writeUInt32BE(result, 0)
    chunk.writeUInt32BE(reason.length, 4)
    chunk.write(reason, 8, reason.length)
    this._write(chunk)
    break
  }
}

VncConnection.prototype._writeServerInit = function() {
  debug('server pixel format', this._serverPixelFormat)
  var chunk = new Buffer(2 + 2 + 16 + 4 + this._serverName.length)
  chunk.writeUInt16BE(this._serverWidth, 0)
  chunk.writeUInt16BE(this._serverHeight, 2)
  chunk[4] = this._serverPixelFormat.bitsPerPixel
  chunk[5] = this._serverPixelFormat.depth
  chunk[6] = this._serverPixelFormat.bigEndianFlag
  chunk[7] = this._serverPixelFormat.trueColorFlag
  chunk.writeUInt16BE(this._serverPixelFormat.redMax, 8)
  chunk.writeUInt16BE(this._serverPixelFormat.greenMax, 10)
  chunk.writeUInt16BE(this._serverPixelFormat.blueMax, 12)
  chunk[14] = this._serverPixelFormat.redShift
  chunk[15] = this._serverPixelFormat.greenShift
  chunk[16] = this._serverPixelFormat.blueShift
  chunk[17] = 0 // padding
  chunk[18] = 0 // padding
  chunk[19] = 0 // padding
  chunk.writeUInt32BE(this._serverName.length, 20)
  chunk.write(this._serverName, 24, this._serverName.length)
  this._write(chunk)
}

VncConnection.prototype._writeVncAuthChallenge = function() {
  var vncSec = this._serverSupportedSecurityByType[VncConnection.SECURITY_VNC]
  debug('vnc auth challenge', vncSec.challenge)
  this._write(vncSec.challenge)
}

VncConnection.prototype._readableListener = function() {
  this._read()
}

VncConnection.prototype._read = function() {
  Promise.all(this._blockingOps).bind(this)
    .then(this._unguardedRead)
}

VncConnection.prototype._auth = function(type, data) {
  var security = this._serverSupportedSecurityByType[type]
  this._blockingOps.push(
    security.auth(data).bind(this)
      .then(function() {
        this._changeState(VncConnection.STATE_NEED_CLIENT_INIT)
        this._writeSecurityResult(VncConnection.SECURITYRESULT_OK)
        this.emit('authenticated')
        this._read()
      })
      .catch(function() {
        this._writeSecurityResult(
          VncConnection.SECURITYRESULT_FAIL, 'Authentication failure')
        this.end()
      })
  )
}

VncConnection.prototype._unguardedRead = function() {
  var chunk, lo, hi
  while (this._append(this.conn.read())) {
    do {
      debug('state', StateReverse[this._state])
      chunk = null
      switch (this._state) {
      case VncConnection.STATE_NEED_CLIENT_VERSION:
        if ((chunk = this._consume(12))) {
          if ((this._clientVersion = this._parseVersion(chunk)) === null) {
            this.end()
            return
          }
          debug('client version', this._clientVersion)
          this._writeSupportedSecurity()
          this._changeState(VncConnection.STATE_NEED_CLIENT_SECURITY)
        }
        break
      case VncConnection.STATE_NEED_CLIENT_SECURITY:
        if ((chunk = this._consume(1))) {
          if ((this._clientSecurity = this._parseSecurity(chunk)) === null) {
            this._writeSecurityResult(
              VncConnection.SECURITYRESULT_FAIL, 'Unimplemented security type')
            this.end()
            return
          }
          debug('client security', this._clientSecurity)
          if (!(this._clientSecurity in this._serverSupportedSecurityByType)) {
            this._writeSecurityResult(
              VncConnection.SECURITYRESULT_FAIL, 'Unsupported security type')
            this.end()
            return
          }
          switch (this._clientSecurity) {
          case VncConnection.SECURITY_NONE:
            this._auth(VncConnection.SECURITY_NONE)
            return
          case VncConnection.SECURITY_VNC:
            this._writeVncAuthChallenge()
            this._changeState(VncConnection.STATE_NEED_CLIENT_VNC_AUTH)
            break
          }
        }
        break
      case VncConnection.STATE_NEED_CLIENT_VNC_AUTH:
        if ((chunk = this._consume(16))) {
          this._auth(VncConnection.SECURITY_VNC, {
            response: chunk
          })
          return
        }
        break
      case VncConnection.STATE_NEED_CLIENT_INIT:
        if ((chunk = this._consume(1))) {
          this._clientShare = chunk[0]
          debug('client shareFlag', this._clientShare)
          this._writeServerInit()
          this._changeState(VncConnection.STATE_NEED_CLIENT_MESSAGE)
        }
        break
      case VncConnection.STATE_NEED_CLIENT_MESSAGE:
        if ((chunk = this._consume(1))) {
          switch (chunk[0]) {
          case VncConnection.CLIENT_MESSAGE_SETPIXELFORMAT:
            this._changeState(
              VncConnection.STATE_NEED_CLIENT_MESSAGE_SETPIXELFORMAT)
            break
          case VncConnection.CLIENT_MESSAGE_SETENCODINGS:
            this._changeState(
              VncConnection.STATE_NEED_CLIENT_MESSAGE_SETENCODINGS)
            break
          case VncConnection.CLIENT_MESSAGE_FBUPDATEREQUEST:
            this._changeState(
              VncConnection.STATE_NEED_CLIENT_MESSAGE_FBUPDATEREQUEST)
            break
          case VncConnection.CLIENT_MESSAGE_KEYEVENT:
            this.emit('userActivity')
            this._changeState(
              VncConnection.STATE_NEED_CLIENT_MESSAGE_KEYEVENT)
            break
          case VncConnection.CLIENT_MESSAGE_POINTEREVENT:
            this.emit('userActivity')
            this._changeState(
              VncConnection.STATE_NEED_CLIENT_MESSAGE_POINTEREVENT)
            break
          case VncConnection.CLIENT_MESSAGE_CLIENTCUTTEXT:
            this.emit('userActivity')
            this._changeState(
              VncConnection.STATE_NEED_CLIENT_MESSAGE_CLIENTCUTTEXT)
            break
          default:
            this._error(new Error(util.format(
              'Unsupported message type %d', chunk[0])))
            return
          }
        }
        break
      case VncConnection.STATE_NEED_CLIENT_MESSAGE_SETPIXELFORMAT:
        if ((chunk = this._consume(19))) {
          // [0b, 3b) padding
          this._clientPixelFormat = new PixelFormat({
            bitsPerPixel: chunk[3]
          , depth: chunk[4]
          , bigEndianFlag: chunk[5]
          , trueColorFlag: chunk[6]
          , redMax: chunk.readUInt16BE(7, true)
          , greenMax: chunk.readUInt16BE(9, true)
          , blueMax: chunk.readUInt16BE(11, true)
          , redShift: chunk[13]
          , greenShift: chunk[14]
          , blueShift: chunk[15]
          })
          // [16b, 19b) padding
          debug('client pixel format', this._clientPixelFormat)
          this.emit('formatchange', this._clientPixelFormat)
          this._changeState(VncConnection.STATE_NEED_CLIENT_MESSAGE)
        }
        break
      case VncConnection.STATE_NEED_CLIENT_MESSAGE_SETENCODINGS:
        if ((chunk = this._consume(3))) {
          // [0b, 1b) padding
          this._clientEncodingCount = chunk.readUInt16BE(1, true)
          this._changeState(
            VncConnection.STATE_NEED_CLIENT_MESSAGE_SETENCODINGS_VALUE)
        }
        break
      case VncConnection.STATE_NEED_CLIENT_MESSAGE_SETENCODINGS_VALUE:
        lo = 0
        hi = 4 * this._clientEncodingCount
        if ((chunk = this._consume(hi))) {
          this._clientEncodings = []
          while (lo < hi) {
            this._clientEncodings.push(chunk.readInt32BE(lo, true))
            lo += 4
          }
          debug('client encodings', this._clientEncodings)
          this._changeState(VncConnection.STATE_NEED_CLIENT_MESSAGE)
        }
        break
      case VncConnection.STATE_NEED_CLIENT_MESSAGE_FBUPDATEREQUEST:
        if ((chunk = this._consume(9))) {
          this.emit('fbupdaterequest', {
            incremental: chunk[0]
          , xPosition: chunk.readUInt16BE(1, true)
          , yPosition: chunk.readUInt16BE(3, true)
          , width: chunk.readUInt16BE(5, true)
          , height: chunk.readUInt16BE(7, true)
          })
          this._changeState(VncConnection.STATE_NEED_CLIENT_MESSAGE)
        }
        break
      case VncConnection.STATE_NEED_CLIENT_MESSAGE_KEYEVENT:
        if ((chunk = this._consume(7))) {
          // downFlag = chunk[0]
          // [1b, 3b) padding
          // key = chunk.readUInt32BE(3, true)
          this._changeState(VncConnection.STATE_NEED_CLIENT_MESSAGE)
        }
        break
      case VncConnection.STATE_NEED_CLIENT_MESSAGE_POINTEREVENT:
        if ((chunk = this._consume(5))) {
          this.emit('pointer', {
            buttonMask: chunk[0]
          , xPosition: chunk.readUInt16BE(1, true) / this._serverWidth
          , yPosition: chunk.readUInt16BE(3, true) / this._serverHeight
          })
          this._changeState(VncConnection.STATE_NEED_CLIENT_MESSAGE)
        }
        break
      case VncConnection.STATE_NEED_CLIENT_MESSAGE_CLIENTCUTTEXT:
        if ((chunk = this._consume(7))) {
          // [0b, 3b) padding
          this._clientCutTextLength = chunk.readUInt32BE(3)
          this._changeState(
            VncConnection.STATE_NEED_CLIENT_MESSAGE_CLIENTCUTTEXT_VALUE)
        }
        break
      case VncConnection.STATE_NEED_CLIENT_MESSAGE_CLIENTCUTTEXT_VALUE:
        if ((chunk = this._consume(this._clientCutTextLength))) {
          // value = chunk
          this._changeState(VncConnection.STATE_NEED_CLIENT_MESSAGE)
        }
        break
      default:
        throw new Error(util.format('Impossible state %d', this._state))
      }
    }
    while (chunk)
  }
}

VncConnection.prototype._parseVersion = function(chunk) {
  if (chunk.equals(new Buffer('RFB 003.008\n'))) {
    return VncConnection.V3_008
  }

  if (chunk.equals(new Buffer('RFB 003.007\n'))) {
    return VncConnection.V3_007
  }

  if (chunk.equals(new Buffer('RFB 003.003\n'))) {
    return VncConnection.V3_003
  }

  return null
}

VncConnection.prototype._parseSecurity = function(chunk) {
  switch (chunk[0]) {
  case VncConnection.SECURITY_NONE:
  case VncConnection.SECURITY_VNC:
    return chunk[0]
  default:
    return null
  }
}

VncConnection.prototype._changeState = function(state) {
  this._state = state
}

VncConnection.prototype._append = function(chunk) {
  if (!chunk) {
    return false
  }

  debug('in', chunk)

  if (this._buffer) {
    this._buffer = Buffer.concat(
      [this._buffer, chunk], this._buffer.length + chunk.length)
  }
  else {
    this._buffer = chunk
  }

  return true
}

VncConnection.prototype._consume = function(n) {
  var chunk

  if (!this._buffer) {
    return null
  }

  if (n < this._buffer.length) {
    chunk = this._buffer.slice(0, n)
    this._buffer = this._buffer.slice(n)
    return chunk
  }

  if (n === this._buffer.length) {
    chunk = this._buffer
    this._buffer = null
    return chunk
  }

  return null
}

VncConnection.prototype._write = function(chunk) {
  debug('out', chunk)
  this.conn.write(chunk)
}

module.exports = VncConnection
