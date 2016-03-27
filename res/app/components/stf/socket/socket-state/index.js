module.exports = angular.module('stf/socket/socket-state', [
  require('stf/socket').name,
  require('stf/common-ui/safe-apply').name,
  require('stf/common-ui/notifications').name,
  require('stf/common-ui/refresh-page').name,
  require('stf/common-ui/modals/socket-disconnected').name
])
  .directive('socketState', require('./socket-state-directive'))
  .config([
    '$provide', function($provide) {
      return $provide.decorator('$rootScope', [
        '$delegate', function($delegate) {
          $delegate.safeApply = function(fn) {
            var phase = $delegate.$$phase
            if (phase === '$apply' || phase === '$digest') {
              if (fn && typeof fn === 'function') {
                fn()
              }
            } else {
              $delegate.$apply(fn)
            }
          }
          return $delegate
        }
      ])
    }
  ])
