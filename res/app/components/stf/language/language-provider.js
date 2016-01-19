//var supportedLanguages = require('./../../../../common/lang/langs.json')

module.exports = function LanguageProvider(AppStateProvider) {
  var provider = {
    selectedLanguage: 'ja' // default
  }

  var a = AppStateProvider.$get()
  if (a && a.user && a.user.settings && a.user.settings &&
    a.user.settings.selectedLanguage) {
    provider.selectedLanguage = a.user.settings.selectedLanguage
  }

  return {
    $get: function() {
      return provider
    }
  }
}

//module.exports = function LanguageProvider() {
//  var LanguageService = {}
//
//  function detectLanguage() {
//    return (navigator.language || navigator.userLanguage || 'en-US')
//      .substring(0, 2)
//  }
//
//  function isSupported(lang) {
//    return !!supportedLanguages[lang]
//  }
//
//  function onlySupported(lang, defaultValue) {
//    return isSupported(lang) ? lang : defaultValue
//  }
//
//  LanguageService.settingKey = 'selectedLanguage'
//  LanguageService.supportedLanguages = supportedLanguages
//  LanguageService.defaultLanguage = 'en'
//  LanguageService.detectedLanguage =
//    onlySupported(detectLanguage(), LanguageService.defaultLanguage)
//
//  return {
//    set: function (constants) {
//      angular.extend(LanguageService, constants)
//    },
//    $get: function (SettingsService, gettextCatalog) {
//      SettingsService.sync(
//        LanguageService, {
//          target: LanguageService.settingKey,
//          source: LanguageService.settingKey,
//          defaultValue: LanguageService.detectedLanguage
//        }, updateLanguage
//      )
//
//      function updateLanguage() {
//        gettextCatalog.setCurrentLanguage(LanguageService.selectedLanguage)
//      }
//
//      LanguageService.updateLanguage = updateLanguage
//
//      return LanguageService
//    }
//  }
//}
