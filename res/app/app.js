require.ensure([], function (require) {

  require('angular')
  require('angular-route')
  require('angular-touch')

  require('angular-gettext')
  require('ng-file-upload')
  require('angular-hotkeys')

  angular.module('app', [
    'ngRoute',
    'ngTouch',
    'gettext',
    'angularFileUpload',
    'cfp.hotkeys',
    require('./layout').name,
    require('./device-list').name,
    require('./control-panes').name,
    require('./menu').name,
    require('./settings').name,
    require('./help').name,
    require('./../common/lang').name,
    require('./../test/samples/vs-repeat').name
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

})
