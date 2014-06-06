module.exports = function SocketStateDirectiveFactory(socket, growl, gettext, $filter) {
  return {
    restrict: 'EA',
    template: require('./socket-state.jade'),
//    scope: {
//    }
    link: function (scope) {
      var hasFailedOnce = false

      socket.on('connect', function () {
        scope.$apply(function () {
          scope.socketState = 'connect'
        })
      })

      socket.on('disconnect', function () {
        scope.$apply(function () {
          scope.socketState = 'disconnect'
        })
        hasFailedOnce = true
      })

      socket.on('error', function () {
        scope.$apply(function () {
          scope.socketState = 'error'
        })
        hasFailedOnce = true
      })

      socket.on('connect_error', function () {
        scope.$apply(function () {
          scope.socketState = 'connect_error'
        })
        hasFailedOnce = true
      })

      socket.on('reconnect_error', function () {
        scope.$apply(function () {
          scope.socketState = 'reconnect_error'
        })
        hasFailedOnce = true
      })

      socket.on('reconnect_failed', function () {
        scope.$apply(function () {
          scope.socketState = 'reconnect_failed'
        })
        hasFailedOnce = true
      })

      socket.on('reconnect', function () {
        scope.$apply(function () {
          scope.socketState = 'reconnect'
        })
        hasFailedOnce = true
      })

      scope.$watch('socketState', function (newValue, oldValue) {
        if (newValue) {
          if (newValue === 'connect') {
            if (hasFailedOnce) {
              growl.success('<h4>WebSocket</h4>' + $filter('translate')(gettext('Connected successfully.')) + '<refresh-page></refresh-page>', {ttl: 2000})
            }
          } else {
            switch (newValue) {
              case 'disconnect':
                growl.error('<h4>WebSocket</h4>' +  $filter('translate')(gettext('Disconnected.<br />Socket connection was lost, try again reloading the page.')), {ttl: -1})
                break;
              case 'connect_error':
              case 'connect_error':
              case 'error':
                growl.error('<h4>WebSocket</h4>' + $filter('translate')(gettext('Error.'), {ttl: -1}))
                break;
              case 'reconnect_failed':
                growl.error('<h4>WebSocket</h4>' + $filter('translate')(gettext('Error while reconnecting.')), {ttl: -1})
                break;
              case 'reconnect':
                growl.success('<h4>WebSocket</h4>' + $filter('translate')(gettext('Reconnected successfully.')), {ttl: -1})
                break;
            }
          }
        }
      })
    }
  }
}
