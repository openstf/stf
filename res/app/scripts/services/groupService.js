define(['./module', 'lodash'], function(mod, _) {
  function GroupServiceFactory($rootScope, socket, userService) {
    var groupService = {
      members: []
    }

    userService.user().then(function(user) {
      function ownerFilter(listener) {
        return function(data) {
          if (data.owner.email === user.email) {
            listener()
          }
        }
      }

      socket.on('group.join', ownerFilter(function(data) {
        groupService.members.push(data.serial)
        console.log('group.join', data)
        $rootScope.$digest()
      }))

      socket.on('group.leave', ownerFilter(function(data) {
        _.pull(groupService.members, data.serial)
        console.log('group.leave', data)
        $rootScope.$digest()
      }))

      socket.on('device.absent', /* unfiltered */ function(data) {
        _.pull(groupService.members, data.serial)
        $rootScope.$digest()
      })
    })

    groupService.invite = function(requirements) {
      userService.user().then(function(user) {
        socket.emit('group.invite', requirements)
      })
    }

    groupService.kick = function(requirements) {
      userService.user().then(function(user) {
        socket.emit('group.kick', requirements)
      })
    }

    return groupService
  }

  mod.factory('groupService'
  , [ '$rootScope'
    , 'socketService'
    , 'userService'
    , GroupServiceFactory
    ])
})
