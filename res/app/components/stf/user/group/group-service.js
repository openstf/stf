var _ = require('lodash')

module.exports = function GroupServiceFactory($rootScope, $http, socket, UserService, TransactionService) {
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

  groupService.invite = function (device) {
    return UserService.user().then(function (user) {
      var tx = TransactionService.create([device])
      socket.emit('group.invite', device.channel, tx.channel, {
        serial: {
          value: device.serial
        , match: 'exact'
        }
      })
      return tx.promise.then(function(results) {
        if (!results[0].success) {
          throw new Error('Device refused to join the group')
        }
        return results[0].device
      })
    })
  }

  groupService.kick = function (device) {
    return UserService.user().then(function (user) {
      var tx = TransactionService.create([device])
      socket.emit('group.kick', device.channel, tx.channel, {
        serial: {
          value: device.serial
        , match: 'exact'
        }
      })
      return tx.promise.then(function(results) {
        if (!results[0].success) {
          throw new Error('Device refused to be kicked from the group')
        }
        return results[0].device
      })
    })
  }

  return groupService
}
