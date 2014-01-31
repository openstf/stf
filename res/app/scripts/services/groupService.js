define(['./module', 'lodash'], function(mod, _) {
  function GroupServiceFactory($rootScope, socket) {
    var groupService = {
      members: []
    }

    socket.on('group.join', function(data) {
      groupService.members.push(data.serial)
      $rootScope.$digest()
    })

    socket.on('group.left', function(data) {
      _.pull(groupService.members, data.serial)
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
    , 'socket'
    , GroupServiceFactory
    ])
})
