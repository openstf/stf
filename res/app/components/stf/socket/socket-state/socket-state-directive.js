module.exports = function SocketStateDirectiveFactory(socket, growl, gettext,
  $filter, SocketDisconnectedService) {

  return {
    restrict: 'EA',
    template: require('./socket-state.jade'),
    link: function (scope) {
      var hasFailedOnce = false

        socket.on('connect', function () {
        scope.$apply(function () {
          scope.socketState = 'connect'
        })
      })

      // TODO: disable this if we are on a onbeforeunload event
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

      scope.$watch('socketState', function (newValue) {
        if (newValue) {
          if (newValue === 'connect') {
            if (hasFailedOnce) {
              growl.success('<h4>WebSocket</h4>' + $filter('translate')(
                gettext('Connected successfully.')) +
              '<refresh-page></refresh-page>', {ttl: 2000})
            }
          } else {
            switch (newValue) {
              case 'disconnect':
                SocketDisconnectedService.open(
                  gettext('Socket connection was lost'))
                break;
              case 'connect_error':
              case 'error':
                SocketDisconnectedService.open(
                  gettext('Error'))
                break;
              case 'reconnect_failed':
                SocketDisconnectedService.open(
                  gettext('Error while reconnecting'))
                break;
              case 'reconnect':
                growl.success('<h4>WebSocket</h4>' + $filter('translate')(
                  gettext('Reconnected successfully.')), {ttl: -1})
                break;
            }
          }
        }
      })
    }
  }
}
