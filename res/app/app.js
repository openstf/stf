require('angular')
require('angular-route')

require('style!raw!se7en-bootstrap-3/build/stylesheets/bootstrap.min.css')
require('style!raw!se7en-bootstrap-3/build/stylesheets/se7en-font.css')
require('style!raw!se7en-bootstrap-3/build/stylesheets/style.css')
require('style!raw!se7en-bootstrap-3/build/stylesheets/font-awesome.min.css')


// Temporary here:
require('fa-borderlayout')
require('fa-borderlayout/build-0.3.1/borderLayout.css')
require('fa-borderlayout/build-0.3.1/stf-style.css')





angular.module('app', [
  'ngRoute',
  require('./device-list').name,
  require('./device-control').name,
  'fa.directive.borderLayout'
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
