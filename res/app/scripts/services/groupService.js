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

    groupService.invite = function(requirements) {
      socket.emit('group.invite', requirements)
    }

    groupService.kick = function(requirements) {
      socket.emit('group.kick', requirements)
    }

    return groupService
  }

  mod.factory('groupService'
  , [ '$rootScope'
    , 'socketService'
    , GroupServiceFactory
    ])
})
