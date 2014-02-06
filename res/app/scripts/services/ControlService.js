define(['./_module', 'lodash'], function(app, _) {
  function ControlServiceFactory($rootScope, socket) {
    var controlService = {
    }

    function ControlService(channel) {
      function touchSender(type) {
        return function(x, y) {
          socket.emit(type, channel, {
            x: x
          , y: y
          })
        }
      }

      function keySender(type) {
        return function(key) {
          socket.emit(type, channel, {
            key: key
          })
        }
      }

      this.touchDown = touchSender('input.touchDown')
      this.touchMove = touchSender('input.touchMove')
      this.touchUp   = touchSender('input.touchUp')
      this.tap       = touchSender('input.tap')

      this.keyDown   = keySender('input.keyDown')
      this.keyUp     = keySender('input.keyUp')
      this.keyPress  = keySender('input.keyPress')

      this.home = function() {
        socket.emit('input.home', channel)
      }

      this.menu = function() {
        socket.emit('input.menu', channel)
      }

      this.back = function() {
        socket.emit('input.back', channel)
      }

      this.type = function(text) {
        socket.emit('input.type', channel, {
          text: text
        })
      }
    }

    controlService.forChannel = function(channel) {
      return new ControlService(channel)
    }

    return controlService
  }

  app.factory('ControlService'
  , [ '$rootScope'
    , 'SocketService'
    , ControlServiceFactory
    ])
})
