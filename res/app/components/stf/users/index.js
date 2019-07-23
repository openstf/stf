/**
* Copyright © 2019 code initially contributed by Orange SA, authors: Denis Barbaron - Licensed under the Apache license 2.0
**/

module.exports = angular.module('stf.users', [
  require('stf/util/common').name
])
.factory('UsersService', require('./users-service'))
