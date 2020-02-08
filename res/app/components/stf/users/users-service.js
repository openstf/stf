/**
* Copyright © 2019 code initially contributed by Orange SA, authors: Denis Barbaron - Licensed under the Apache license 2.0
**/

const oboe = require('oboe')

module.exports = function UsersServiceFactory(
  $rootScope
, $http
, socket
, CommonService
) {
  const UsersService = {}

  function buildQueryParameters(filters) {
    var query = ''

    if (filters.groupOwner !== 'Any') {
      query += 'groupOwner=' + filters.groupOwner.toLowerCase()
    }
    return query === '' ? query : '?' + query
  }

  UsersService.getOboeUsers = function(fields, addUser) {
    return oboe(CommonService.getBaseUrl() + '/api/v1/users?fields=' + fields)
      .node('users[*]', function(user) {
        addUser(user)
      })
  }

  UsersService.getUsers = function(fields) {
    return $http.get('/api/v1/users?fields=' + fields)
  }

  UsersService.getUser = function(email, fields) {
    return $http.get('/api/v1/users/' + email + '?fields=' + fields)
  }

  UsersService.removeUser = function(email, filters) {
    return $http.delete('/api/v1/users/' + email + buildQueryParameters(filters))
  }

  UsersService.removeUsers = function(filters, emails) {
    return $http({
      method: 'DELETE',
      url: '/api/v1/users' + buildQueryParameters(filters),
      headers: {
        'Content-Type': 'application/json;charset=utf-8'
      },
      data: typeof emails === 'undefined' ? emails : JSON.stringify({emails: emails})
    })
  }

  UsersService.updateUserGroupsQuotas = function(email, number, duration, repetitions) {
    return $http.put(
      '/api/v1/users/' + email +
      '/groupsQuotas?number=' + number +
      '&duration=' + duration +
      '&repetitions=' + repetitions
    )
  }

  UsersService.updateDefaultUserGroupsQuotas = function(number, duration, repetitions) {
    return $http.put(
      '/api/v1/users/groupsQuotas?number=' + number +
      '&duration=' + duration +
      '&repetitions=' + repetitions
    )
  }

  UsersService.createUser = function(name, email) {
    return $http.post('/api/v1/users/' + email + '?name=' + name)
  }

  socket.on('user.settings.users.created', function(user) {
    $rootScope.$broadcast('user.settings.users.created', user)
    $rootScope.$apply()
  })

  socket.on('user.settings.users.deleted', function(user) {
    $rootScope.$broadcast('user.settings.users.deleted', user)
    $rootScope.$apply()
  })

  socket.on('user.view.users.updated', function(user) {
    $rootScope.$broadcast('user.view.users.updated', user)
    $rootScope.$apply()
  })

  socket.on('user.settings.users.updated', function(user) {
    $rootScope.$broadcast('user.settings.users.updated', user)
    $rootScope.$apply()
  })

  return UsersService
}
