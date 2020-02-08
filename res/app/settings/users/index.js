/**
* Copyright © 2019 code initially contributed by Orange SA, authors: Denis Barbaron - Licensed under the Apache license 2.0
**/

require('./users.css')

module.exports = angular.module('stf.settings.users', [
  require('stf/app-state').name,
  require('stf/settings').name,
  require('stf/util/common').name,
  require('stf/users').name
])
  .run(['$templateCache', function($templateCache) {
    $templateCache.put(
      'settings/users/users.pug', require('./users.pug')
    )
  }])
  .controller('UsersCtrl', require('./users-controller'))
