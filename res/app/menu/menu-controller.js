/**
* Copyright © 2019 contains code contributed by Orange SA, authors: Denis Barbaron - Licensed under the Apache license 2.0
**/

module.exports = function MenuCtrl(
  $scope
, $rootScope
, SettingsService
, $location
, $http
, CommonService
, LogcatService
, socket
, $cookies
, $window) {

  SettingsService.bind($scope, {
    target: 'lastUsedDevice'
  })

  SettingsService.bind($rootScope, {
    target: 'platform',
    defaultValue: 'native',
    deviceEntries: LogcatService.deviceEntries
  })

  $scope.$on('$routeChangeSuccess', function() {
    $scope.isControlRoute = $location.path().search('/control') !== -1
  })

  $scope.mailToSupport = function() {
    CommonService.url('mailto:' + $scope.contactEmail)
  }

  $http.get('/auth/contact').then(function(response) {
    $scope.contactEmail = response.data.contact.email
  })

  $scope.logout = function() {
    $cookies.remove('XSRF-TOKEN', {path: '/'})
    $cookies.remove('ssid', {path: '/'})
    $cookies.remove('ssid.sig', {path: '/'})
    $window.location = '/'
    setTimeout(function() {
      socket.disconnect()
    }, 100)
  }
}
