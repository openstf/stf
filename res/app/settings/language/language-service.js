//var _ = require('lodash')

module.exports = function LanguageServiceFactory() {
  alert('he')

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
  LanguageService.selectedLanguage = defaultLanguage

  LanguageService.getSelectedLanguage = function () {
    return LanguageService.selectedLanguage = defaultLanguage //WebStorage.get('Language.language') || defaultLanguage
  }

  return LanguageService
}
