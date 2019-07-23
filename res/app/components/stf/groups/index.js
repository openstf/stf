/**
* Copyright © 2019 code initially contributed by Orange SA, authors: Denis Barbaron - Licensed under the Apache license 2.0
**/

module.exports = angular.module('stf.groups', [
  require('stf/util/common').name
])
.factory('GroupsService', require('./groups-service'))
