module.exports = function($scope, LanguageService, SettingsService) {
  SettingsService.bind($scope, {
    target: 'language'
  , source: LanguageService.settingKey
  , defaultValue: LanguageService.detectedLanguage
  })

  $scope.supportedLanguages = LanguageService.supportedLanguages
}
