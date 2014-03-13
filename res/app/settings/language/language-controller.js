module.exports = function ($scope, LanguageService, SettingsService) {
//  SettingsService.sync($scope, 'Language', {
//    language: LanguageService.detectedLanguage
//  })

//  SettingsService.bind($scope, {
//    key: 'language',
//    defaultValue: LanguageService.selectedLanguage
//  })

  LanguageService.getSelectedLanguage().then(function (data) {
    $scope.language = data
    console.log('real', data)
  })

  $scope.$watch('language', function (newValue, oldValue) {
    if (newValue !== oldValue) {
      LanguageService.setSelectedLanguage(newValue)
    }
  })

  $scope.supportedLanguages = LanguageService.supportedLanguages
}
