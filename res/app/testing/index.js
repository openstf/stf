module.exports = angular.module('stf.testing', [
  require('./run-test').name,
  require('./jobs').name,
  require('stf/common-ui/nice-tabs').name
])
  .config(['$routeProvider', function($routeProvider) {
    $routeProvider.when('/testing', {
      template: require('./testing.pug')
    })
  }])
  .controller('TestingCtrl', require('./testing-controller'))
