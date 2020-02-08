/**
* Copyright © 2019 contains code contributed by Orange SA, authors: Denis Barbaron - Licensed under the Apache license 2.0
**/

require('./settings.css')

module.exports = angular.module('ui-settings', [
  require('./general').name,
  require('./keys').name,
  require('./groups').name,
  require('./devices').name,
  require('./users').name,
  require('stf/app-state').name,
  require('stf/common-ui/nice-tabs').name
  //require('./notifications').name
])
  .config(['$routeProvider', function($routeProvider) {
    $routeProvider.when('/settings', {
      template: require('./settings.pug')
    })
  }])
  .controller('SettingsCtrl', require('./settings-controller'))
