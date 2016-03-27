module.exports = function($scope, SettingsService) {
  $scope.resetSettings = function() {
    SettingsService.reset()
    alert('Settings cleared')
  }

}
