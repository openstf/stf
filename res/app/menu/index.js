/**
* Copyright © 2019 contains code contributed by Orange SA, authors: Denis Barbaron - Licensed under the Apache license 2.0
**/

require('./menu.css')
require('angular-cookies')

module.exports = angular.module('stf.menu', [
  'ngCookies',
  require('stf/socket').name,
  require('stf/util/common').name,
  require('stf/nav-menu').name,
  require('stf/settings').name,
  require('stf/common-ui/modals/external-url-modal').name,
  require('stf/native-url').name
])
  .controller('MenuCtrl', require('./menu-controller'))
  .run(['$templateCache', function($templateCache) {
    $templateCache.put('menu.pug', require('./menu.pug'))
  }])
