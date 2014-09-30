require('./access-tokens.css')

module.exports = angular.module('stf.access-tokens', [
  require('stf/common-ui').name
])
  .run(["$templateCache", function ($templateCache) {
    $templateCache.put(
      'settings/keys/access-tokens/access-tokens.jade', require('./access-tokens.jade')
    )
  }])
  .controller('AccessTokensCtrl', require('./access-tokens-controller'))
