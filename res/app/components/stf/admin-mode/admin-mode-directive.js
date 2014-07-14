module.exports = function adminModeDirective($rootScope, SettingsService) {
  return {
    restrict: 'AE',
    link: function (scope) {
      SettingsService.bind($rootScope, {
        target: 'adminMode',
        defaultValue: false
      })
    }
  }
}
