module.exports = angular.module('ui-settings', [
  require('./local').name,
  require('./language').name,
  require('./notifications').name
])
  .config(['$routeProvider', function ($routeProvider) {
    $routeProvider.when('/settings', {
      template: require('./settings.jade')
    })
  }])
