/**
* Copyright © 2019 code initially contributed by Orange SA, authors: Denis Barbaron - Licensed under the Apache license 2.0
**/

require('./group-list.css')

module.exports = angular.module('group-list', [
  require('stf/column-choice').name,
  require('stf/groups').name,
  require('stf/user').name,
  require('stf/users').name,
  require('stf/devices').name,
  require('stf/settings').name,
  require('stf/util/common').name,
  require('stf/common-ui').name
])
  .config(['$routeProvider', function($routeProvider) {
    $routeProvider
      .when('/groups', {
        template: require('./group-list.pug'),
        controller: 'GroupListCtrl'
      })
  }])
  .run(['$templateCache', function($templateCache) {
    $templateCache.put(
      'group-list/stats/group-stats.pug', require('./stats/group-stats.pug')
    )
    $templateCache.put(
      'group-list/stats/group-quota-stats.pug', require('./stats/group-quota-stats.pug')
    )
    $templateCache.put(
      'group-list/groups/groups.pug', require('./groups/groups.pug')
    )
  }])
  .controller('GroupListCtrl', require('./group-list-controller'))
