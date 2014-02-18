var _ = require('lodash')

module.exports = function GroupServiceFactory($rootScope, $http, socket, UserService) {
  var groupService = {
  }

  groupService.group = (function () {
    var groupPromise = $http.get('/api/v1/group')
      .then(function (response) {
        return response.data.group
      })
    return function () {
      return groupPromise
    }
  })()

  UserService.user().then(function (user) {
    function ownerFilter(listener) {
      return function (data) {
        if (data.owner.email === user.email) {
          listener()
        }
      }
    }

    socket.on('group.join', ownerFilter(function (data) {
      groupService.group().then(function (group) {
        group.members.push(data.serial)
        console.log('group.join', data)
        $rootScope.$digest()
      })
    }))

    socket.on('group.leave', ownerFilter(function (data) {
      groupService.group().then(function (group) {
        _.pull(group.members, data.serial)
        console.log('group.leave', data)
        $rootScope.$digest()
      })
    }))

    socket.on('device.absent', /* unfiltered */ function (data) {
      groupService.group().then(function (group) {
        _.pull(group.members, data.serial)
        $rootScope.$digest()
      })
    })
  })

  groupService.invite = function (requirements) {
    UserService.user().then(function (user) {
      socket.emit('group.invite', requirements)
    })
  }

  groupService.kick = function (requirements) {
    UserService.user().then(function (user) {
      socket.emit('group.kick', requirements)
    })
  }

  return groupService
}