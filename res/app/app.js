/**
* Copyright © 2019 contains code contributed by Orange SA, authors: Denis Barbaron - Licensed under the Apache license 2.0
**/

require.ensure([], function(require) {
  require('angular')
  require('angular-route')
  require('angular-touch')

  angular.module('app', [
    'ngRoute',
    'ngTouch',
    require('gettext').name,
    require('angular-hotkeys').name,
    require('./layout').name,
    require('./device-list').name,
    require('./group-list').name,
    require('./control-panes').name,
    require('./menu').name,
    require('./settings').name,
    require('./docs').name,
    require('./user').name,
    require('./../common/lang').name,
    require('stf/standalone').name,
    require('./group-list').name
  ])
    .config(function($routeProvider, $locationProvider) {
      $locationProvider.hashPrefix('!')
      $routeProvider
        .otherwise({
          redirectTo: '/devices'
        })
    })

    .config(function(hotkeysProvider) {
      hotkeysProvider.templateTitle = 'Keyboard Shortcuts:'
    })
})
