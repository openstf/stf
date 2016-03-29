module.exports = angular.module('stf.tokens', [
  require('./generate-access-token').name
])
.factory('AccessTokenService', require('./access-token-service'))
