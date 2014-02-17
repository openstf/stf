require('angular')
require('angular-route')

var app = angular.module('app', [
  'ngRoute',
  require('./components/device-list').name
])


app.config(['$routeProvider', '$locationProvider',
  function ($routeProvider, $locationProvider) {
    $locationProvider.hashPrefix('!');
    $routeProvider
      .otherwise({
        redirectTo: '/devices'
      })
  }
])
