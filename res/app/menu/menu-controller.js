module.exports = function MenuCtrl($scope, $rootScope, SettingsService,
  $location, LogcatService) {

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

}
