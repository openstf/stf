module.exports = function MenuCtrl($scope, $rootScope, SettingsService, $location) {
  $rootScope.platform = 'native'
  SettingsService.bind($rootScope, {
    key: 'platform',
    storeName: 'Platform'
  })

  $scope.$on('$routeChangeSuccess', function () {
    $scope.isControlRoute = $location.path().search('/control') !== -1
  })
}
