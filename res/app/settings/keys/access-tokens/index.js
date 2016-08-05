require('./access-tokens.css')

module.exports = angular.module('stf.settings.keys.access-tokens', [
  require('stf/common-ui').name,
  require('stf/tokens').name,
  require('stf/tokens/generate-access-token').name
])
  .run(['$templateCache', function($templateCache) {
    $templateCache.put(
      'settings/keys/access-tokens/access-tokens.pug', require('./access-tokens.pug')
    )
  }])
  .controller('AccessTokensCtrl', require('./access-tokens-controller'))
