require('angular')
require('angular-route')
require('angular-touch')

require('angular-gettext')
require('ng-file-upload-shim5')
require('ng-file-upload-main')

angular.module('app', [
  'ngRoute',
  'ngTouch',
  'gettext',
  'angularFileUpload',
  require('./layout').name,
  require('./device-list').name,
  require('./control-panes').name,
  require('./menu').name,
  require('./settings').name,
  require('./help').name,
  require('./../common/lang').name
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
