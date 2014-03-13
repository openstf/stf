module.exports = angular.module('ui-settings', [
  require('./language').name
])
  .config(['$routeProvider', function ($routeProvider) {
    $routeProvider.when('/settings', {
      template: require('./settings.jade')
    })
  }])
  //.controller('SettingsCtrl', require('./settings-controller'))
