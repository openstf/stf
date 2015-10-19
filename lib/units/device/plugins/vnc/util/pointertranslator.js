var util = require('util')

var EventEmitter = require('eventemitter3').EventEmitter

function PointerTranslator() {
  this.previousEvent = null
}

util.inherits(PointerTranslator, EventEmitter)

PointerTranslator.prototype.push = function(event) {
  if (event.buttonMask & 0xFE) {
    // Non-primary buttons included, ignore.
    return
  }

  if (this.previousEvent) {
    var buttonChanges = event.buttonMask ^ this.previousEvent.buttonMask

    // If the primary button changed, we have an up/down event.
    if (buttonChanges & 1) {
      // If it's pressed now, that's a down event.
      if (event.buttonMask & 1) {
        this.emit('touchdown', {
          contact: 1
        , x: event.xPosition
        , y: event.yPosition
        })
        this.emit('touchcommit')
      }
      // It's not pressed, so we have an up event.
      else {
        this.emit('touchup', {
          contact: 1
        })
        this.emit('touchcommit')
      }
    }
    // Otherwise, if we're still holding the primary button down,
    // that's a move event.
    else if (event.buttonMask & 1) {
      this.emit('touchmove', {
        contact: 1
      , x: event.xPosition
      , y: event.yPosition
      })
      this.emit('touchcommit')
    }
  }
  else {
    // If it's the first event we get and the primary button's pressed,
    // it's a down event.
    if (event.buttonMask & 1) {
      this.emit('touchdown', {
        contact: 1
      , x: event.xPosition
      , y: event.yPosition
      })
      this.emit('touchcommit')
    }
  }

  this.previousEvent = event
}

module.exports = PointerTranslator
