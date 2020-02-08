/**
* Copyright © 2019 code initially contributed by Orange SA, authors: Denis Barbaron - Licensed under the Apache license 2.0
**/

const oboe = require('oboe')

module.exports = function GroupsServiceFactory(
  $rootScope
, $http
, socket
, CommonService
) {
  const GroupsService = {}

  GroupsService.getGroupUsers = function(id, fields) {
    return $http.get('/api/v1/groups/' + id + '/users?fields=' + fields)
  }

  GroupsService.getOboeGroupUsers = function(id, fields, addGroupUser) {
    return oboe(CommonService.getBaseUrl()
    + '/api/v1/groups/' + id + '/users?fields=' + fields)
      .node('users[*]', function(user) {
        addGroupUser(user)
      })
  }

  GroupsService.getGroupDevices = function(id, bookable, fields) {
    return $http.get('/api/v1/groups/' + id + '/devices?bookable=' + bookable + '&fields=' + fields)
  }

  GroupsService.getOboeGroupDevices = function(id, bookable, fields, addGroupDevice) {
    return oboe(CommonService.getBaseUrl()
    + '/api/v1/groups/' + id + '/devices?bookable=' + bookable + '&fields=' + fields)
      .node('devices[*]', function(device) {
        addGroupDevice(device)
      })
  }

  GroupsService.getGroupDevice = function(id, serial, fields) {
    return $http.get('/api/v1/groups/' + id + '/devices/' + serial + '?fields=' + fields)
  }

  GroupsService.addGroupDevice = function(id, serial) {
    return $http.put('/api/v1/groups/' + id + '/devices/' + serial)
  }

  GroupsService.addGroupDevices = function(id, serials) {
    return $http({
      method: 'PUT',
      url: '/api/v1/groups/' + id + '/devices',
      data: typeof serials === 'undefined' ? serials : JSON.stringify({serials: serials})
    })
  }

  GroupsService.removeGroupDevice = function(id, serial) {
    return $http.delete('/api/v1/groups/' + id + '/devices/' + serial)
  }

  GroupsService.removeGroupDevices = function(id, serials) {
    return $http({
      method: 'DELETE',
      url: '/api/v1/groups/' + id + '/devices',
      headers: {
        'Content-Type': 'application/json;charset=utf-8'
      },
      data: typeof serials === 'undefined' ? serials : JSON.stringify({serials: serials})
    })
  }

  GroupsService.addGroupUser = function(id, email) {
    return $http.put('/api/v1/groups/' + id + '/users/' + email)
  }

  GroupsService.addGroupUsers = function(id, emails) {
    return $http({
      method: 'PUT',
      url: '/api/v1/groups/' + id + '/users',
      data: typeof emails === 'undefined' ? emails : JSON.stringify({emails: emails})
    })
  }

  GroupsService.removeGroupUser = function(id, email) {
    return $http.delete('/api/v1/groups/' + id + '/users/' + email)
  }

  GroupsService.removeGroupUsers = function(id, emails) {
    return $http({
      method: 'DELETE',
      url: '/api/v1/groups/' + id + '/users',
      headers: {
        'Content-Type': 'application/json;charset=utf-8'
      },
      data: typeof emails === 'undefined' ? emails : JSON.stringify({emails: emails})
    })
  }

  GroupsService.getOboeGroups = function(addGroup) {
    return oboe(CommonService.getBaseUrl() + '/api/v1/groups')
      .node('groups[*]', function(group) {
        addGroup(group)
      })
  }

  GroupsService.getGroups = function() {
    return $http.get('/api/v1/groups')
  }

  GroupsService.getOboeMyGroups = function(addGroup) {
    return oboe(CommonService.getBaseUrl() + '/api/v1/groups?owner=true')
      .node('groups[*]', function(group) {
        addGroup(group)
      })
  }

  GroupsService.getMyGroups = function() {
    return $http.get('/api/v1/groups?owner=true')
  }

  GroupsService.getGroup = function(id) {
    return $http.get('/api/v1/groups/' + id)
  }

  GroupsService.removeGroup = function(id) {
    return $http.delete('/api/v1/groups/' + id)
  }

  GroupsService.removeGroups = function(ids) {
    return $http({
      method: 'DELETE',
      url: '/api/v1/groups?_=' + Date.now(),
      headers: {
        'Content-Type': 'application/json;charset=utf-8'
      },
      data: typeof ids === 'undefined' ? ids : JSON.stringify({ids: ids})
    })
  }

  GroupsService.createGroup = function() {
    return $http({
      method: 'POST',
      url: '/api/v1/groups',
      data: JSON.stringify({'state': 'pending'})
    })
  }

  GroupsService.updateGroup = function(id, data) {
    return $http({
      method: 'PUT',
      url: '/api/v1/groups/' + id,
      data: JSON.stringify(data)
    })
  }
  socket.on('user.settings.groups.created', function(group) {
    $rootScope.$broadcast('user.settings.groups.created', group)
    $rootScope.$apply()
  })

  socket.on('user.settings.groups.deleted', function(group) {
    $rootScope.$broadcast('user.settings.groups.deleted', group)
    $rootScope.$apply()
  })

  socket.on('user.settings.groups.updated', function(group) {
    $rootScope.$broadcast('user.settings.groups.updated', group)
    $rootScope.$apply()
  })

  socket.on('user.view.groups.created', function(group) {
    $rootScope.$broadcast('user.view.groups.created', group)
    $rootScope.$apply()
  })

  socket.on('user.view.groups.deleted', function(group) {
    $rootScope.$broadcast('user.view.groups.deleted', group)
    $rootScope.$apply()
  })

  socket.on('user.view.groups.updated', function(group) {
    $rootScope.$broadcast('user.view.groups.updated', group)
    $rootScope.$apply()
  })

  return GroupsService
}
