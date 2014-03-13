module.exports = angular.module('stf-ui-language', [
  require('stf/settings').name
])
  .run(["$templateCache", function($templateCache) {
    $templateCache.put('settings/language/language.jade', require('./language.jade'))
  }])
  .factory('LanguageService', require('./language-service'))
  .controller('LanguageCtrl', require('./language-controller'))
