var _ = require('lodash')

module.exports = function LanguageServiceFactory(SettingsService, $q, gettextCatalog) {
  var LanguageService = {}

  LanguageService.supportedLanguages = [
    {code: 'en', name: 'English'},
    {code: 'ja', name: '日本語'}
  ]

  var browserLocale = navigator.language || navigator.userLanguage || 'en-US'
  var browserLanguage = browserLocale.substring(0, 2)
  var detectedLanguage = _.some(LanguageService.supportedLanguages, {code: browserLanguage}) ? browserLanguage : 'en'
  var defaultLanguage = 'ja'
  LanguageService.detectedLanguage = defaultLanguage
  LanguageService.selectedLanguage = null

  // TODO: Can't this be refactored to something like this?
  //  SettingsService.sync(LanguageService.selectedLanguage, 'Language', {
  //    selected: LanguageService.detectedLanguage
  //  })

  LanguageService.getSelectedLanguage = function () {
    var deferred = $q.defer()
    if (LanguageService.selectedLanguage) {
      deferred.resolve(LanguageService.selectedLanguage)
    } else {
      SettingsService.getItem('Language.selected').then(function (data) {
        if (data) {
          deferred.resolve(data)
        } else {
          LanguageService.setSelectedLanguage(LanguageService.detectedLanguage).then(function () {
            deferred.resolve(LanguageService.detectedLanguage)
          })
        }
      })
    }
    return deferred.promise
  }

  // Initialize gettextCatalog
  LanguageService.getSelectedLanguage()


  LanguageService.setSelectedLanguage = function (lang) {
    var deferred = $q.defer()
    LanguageService.selectedLanguage = lang
    gettextCatalog.currentLanguage = lang
    SettingsService.setItem('Language.selected', lang).then(function () {
      deferred.resolve(lang)
    })
    return deferred.promise
  }

  return LanguageService
}
