require('angular')
require('angular-route')

angular.module('app', [
  'ngRoute',
  require('./components/device-list').name
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
