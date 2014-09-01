module.exports = angular.module('stf-language', [
  require('stf/settings').name,
  require('gettext').name,
  require('stf/app-state').name
])
  .factory('LanguageService', require('./language-service'))
  .provider('language', require('./language-provider'))
