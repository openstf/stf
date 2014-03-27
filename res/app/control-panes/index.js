require('fa-borderlayout')
require('fa-borderlayout/build-0.3.1/borderLayout.css')
require('fa-borderlayout/build-0.3.1/stf-style.css')


module.exports = angular.module('control-panes', [
  require('stf/common-ui/nice-tabs').name
])
  .config(['$routeProvider', function ($routeProvider) {
    $routeProvider.when('/control-panes', {
      template: require('./control-panes.jade'),
      controller: 'ControlPanesCtrl'
    })
  }])
  .factory('ControlPanesService', require('./control-panes-service'))
  .controller('ControlPanesCtrl', require('./control-panes-controller'))
