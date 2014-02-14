require('angular')
require('angular-route')

var app = require('./app')

app.config([
  '$routeProvider', '$locationProvider'
  , function ($routeProvider, $locationProvider) {
    $locationProvider.hashPrefix('!')
    $routeProvider
      .when('/devices', {
        templateUrl: 'partials/devices/index', controller: 'DeviceListCtrl'
      })
      .when('/devices/:serial', {
        templateUrl: 'partials/devices/control', controller: 'DeviceControlCtrl'
      })
      .otherwise({
        redirectTo: '/devices'
      })
  }
]);
