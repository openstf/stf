module.exports = angular.module('stf-ui-language', [
  require('stf/settings').name,
  require('stf/language').name
])
  .run(['$templateCache', function($templateCache) {
    $templateCache.put(
      'settings/general/language/language.jade', require('./language.jade')
    )
  }])
  .controller('LanguageCtrl', require('./language-controller'))
