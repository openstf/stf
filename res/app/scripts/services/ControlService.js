define(['./_module', 'lodash'], function(services, _) {
  function ControlServiceFactory($rootScope, socket) {
    var controlService = {
      members: []
    }

    function touchSender(type) {
      return function(x, y) {
        socket.emit(type, {
          x: x
        , y: y
        })
      }
    }

    function keySender(type) {
      return function(key) {
        socket.emit(type, {
          key: key
        })
      }
    }

    controlService.touchDown = touchSender('input.touchDown')
    controlService.touchMove = touchSender('input.touchMove')
    controlService.touchUp   = touchSender('input.touchUp')
    controlService.tap       = touchSender('input.tap')

    controlService.keyDown   = keySender('input.keyDown')
    controlService.keyUp     = keySender('input.keyUp')
    controlService.keyPress  = keySender('input.keyPress')

    controlService.home = function() {
      socket.emit('input.home')
    }

    controlService.menu = function() {
      socket.emit('input.menu')
    }

    controlService.back = function() {
      socket.emit('input.back')
    }

    controlService.type = function(text) {
      socket.emit('input.type', {
        text: text
      })
    }

    return controlService
  }

  services.factory('ControlService'
  , [ '$rootScope'
    , 'SocketService'
    , ControlServiceFactory
    ])
})
