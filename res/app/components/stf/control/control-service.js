module.exports = function ControlServiceFactory($rootScope, socket, TransactionService) {
  var controlService = {
  }

  function ControlService(devices, channel) {
    var keyCodes = {
      8: 8 // backspace
    , 13: 13 // enter
    , 20: 20 // caps lock
    , 27: 27 // esc
    , 33: 33 // page up
    , 34: 34 // page down
    , 35: 35 // end
    , 36: 36 // home
    , 37: 37 // left arrow
    , 38: 38 // up arrow
    , 39: 39 // right arrow
    , 40: 40 // down arrow
    , 45: 45 // insert
    , 46: 46 // delete
    , 93: 93 // windows menu key
    , 112: 112 // f1
    , 113: 113 // f2
    , 114: 114 // f3
    , 115: 115 // f4
    , 116: 116 // f5
    , 117: 117 // f6
    , 118: 118 // f7
    , 119: 119 // f8
    , 120: 120 // f9
    , 121: 121 // f10
    , 122: 122 // f11
    , 123: 123 // f12
    , 144: 144 // num lock
    }

    function touchSender(type) {
      return function(x, y) {
        socket.emit(type, channel, {
          x: x
        , y: y
        })
      }
    }

    function keySender(type, fixedKey) {
      return function(key) {
        var mapped = fixedKey || keyCodes[key]
        if (mapped) {
          socket.emit(type, channel, {
            key: mapped
          })
        }
      }
    }

    this.touchDown = touchSender('input.touchDown')
    this.touchMove = touchSender('input.touchMove')
    this.touchUp   = touchSender('input.touchUp')
    this.tap       = touchSender('input.tap')

    this.keyDown   = keySender('input.keyDown')
    this.keyUp     = keySender('input.keyUp')
    this.keyPress  = keySender('input.keyPress')

    this.home = keySender('input.keyPress', 3)
    this.menu = keySender('input.keyPress', 93)
    this.back = keySender('input.keyPress', 4)

    this.type = function(text) {
      socket.emit('input.type', channel, {
        text: text
      })
    }

    this.shell = function(command) {
      var tx = TransactionService.create(devices)
      socket.emit('shell.command', channel, tx.channel, {
        command: command
      , timeout: 10000
      })
      return tx
    }
  }

  controlService.forOne = function(device, channel) {
    return new ControlService([device], channel)
  }

  controlService.forMany = function(devices, channel) {
    return new ControlService(devices, channel)
  }

  return controlService
}
