module.exports = function adminModeDirective($rootScope, SettingsService) {
  return {
    restrict: 'AE',
    link: function() {
      SettingsService.bind($rootScope, {
        target: 'adminMode',
        defaultValue: false
      })
    }
  }
}
