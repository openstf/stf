var supportedLanguages = require('./../../../../common/lang/langs.json')

module.exports =
  function LanguageServiceFactory(SettingsService, gettextCatalog) {
    // TODO: make this LanguageProvider so it can be used on config

    var LanguageService = {}

    function detectLanguage() {
      return (navigator.language || navigator.userLanguage || 'en-US')
        .substring(0, 2)
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
