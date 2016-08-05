var supportedLanguages = require('./../../../../common/lang/langs.json')
var _ = require('lodash')

module.exports =
  function LanguageServiceFactory(SettingsService, gettextCatalog) {
    // TODO: make this LanguageProvider so it can be used on config

    var LanguageService = {}

    function detectLanguage() {
      return navigator.language || navigator.userLanguage
    }

    function browserToSupportedLang(lang) {
      //supportedLanguages.

      //return lang.replace(/([A-Za-z]{2})(-|_)?([A-Za-z]{0,4})/gm, '$1')
    }

    function isSupported(lang) {
      return !!supportedLanguages[lang]
    }

    function onlySupported(lang, defaultValue) {
      return isSupported(lang) ? lang : defaultValue
    }

    LanguageService.settingKey = 'selectedLanguage'
    LanguageService.supportedLanguages = supportedLanguages
    LanguageService.defaultLanguage = 'en'
    LanguageService.detectedLanguage =
      onlySupported(detectLanguage(), LanguageService.defaultLanguage)

    SettingsService.sync(
      LanguageService, {
        target: LanguageService.settingKey,
        source: LanguageService.settingKey,
        defaultValue: LanguageService.detectedLanguage
      }, updateLanguage
    )

    function updateLanguage() {
      gettextCatalog.setCurrentLanguage(LanguageService.selectedLanguage)
    }

    LanguageService.updateLanguage = updateLanguage

    return LanguageService
  }
