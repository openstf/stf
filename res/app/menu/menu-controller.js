module.exports = function MenuCtrl($scope, $rootScope, SettingsService) {
  $rootScope.platform = 'native'
  SettingsService.bind($rootScope, {
    key: 'platform',
    storeName: 'Platform'
  })
}
