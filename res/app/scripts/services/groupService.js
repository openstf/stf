define(['./module', 'lodash'], function(mod, _) {
  function GroupServiceFactory($rootScope, socket) {
    var groupService = {
      members: []
    }

    socket.on('group.join', function(data) {
      groupService.members.push(data.serial)
      console.log('group.join', data)
      $rootScope.$digest()
    })

    socket.on('group.leave', function(data) {
      _.pull(groupService.members, data.serial)
      console.log('group.leave', data)
      $rootScope.$digest()
    })

    socket.on('device.absent', function(data) {
      _.pull(groupService.members, data.serial)
      $rootScope.$digest()
    })

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

    groupService.invite = function(requirements) {
      socket.emit('group.invite', requirements)
    }

    groupService.kick = function(requirements) {
      socket.emit('group.kick', requirements)
    }

    groupService.touchDown = touchSender('input.touchDown')
    groupService.touchMove = touchSender('input.touchMove')
    groupService.touchUp   = touchSender('input.touchUp')
    groupService.tap       = touchSender('input.tap')

    groupService.keyDown   = keySender('input.keyDown')
    groupService.keyUp     = keySender('input.keyUp')
    groupService.keyPress  = keySender('input.keyPress')

    groupService.home = function() {
      socket.emit('input.home')
    }

    groupService.menu = function() {
      socket.emit('input.menu')
    }

    groupService.back = function() {
      socket.emit('input.back')
    }

    groupService.type = function(text) {
      socket.emit('input.type', {
        text: text
      })
    }

    return groupService
  }

  mod.factory('groupService'
  , [ '$rootScope'
    , 'socketService'
    , GroupServiceFactory
    ])
})
