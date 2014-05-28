module.exports = angular.module('stf.help.shell', [])
  .config(['$routeProvider', function ($routeProvider) {
    $routeProvider.when('/help/shell', {
      template: require('./shell.jade')
    })
  }])
