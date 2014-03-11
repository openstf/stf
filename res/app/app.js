require('angular')
require('angular-route')

require('angular-gettext')

angular.module('app', [
  'ngRoute',
  'gettext',
  require('./layout').name,
  require('./device-list').name,
  require('./device-control').name
])
  .config(['$routeProvider', '$locationProvider',
    function ($routeProvider, $locationProvider) {
      $locationProvider.hashPrefix('!');
      $routeProvider
        .otherwise({
          redirectTo: '/devices'
        })
    }
  ])
