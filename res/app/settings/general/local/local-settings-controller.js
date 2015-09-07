module.exports = function ($scope, SettingsService) {
  $scope.resetSettings = function () {
    SettingsService.reset()
    console.log('Settings cleared')
  }

}
