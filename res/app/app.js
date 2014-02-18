require('angular')
require('angular-route')

require('./app-styles')

angular.module('app', [
  'ngRoute',
  require('./device-list').name
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
