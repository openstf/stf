module.exports = function MenuCtrl($scope, $rootScope, SettingsService) {
  $rootScope.platform = 'web'
  SettingsService.bind($rootScope, {
    key: 'platform',
    storeName: 'Platform'
  })
}
