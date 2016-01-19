module.exports = function SocketStateDirectiveFactory(
  socket
, growl
, gettext
, $filter
, SocketDisconnectedService
, $window
) {
  return {
    restrict: 'EA',
    template: require('./socket-state.jade'),
    link: function(scope) {
      var hasFailedOnce = false

      function setState(state) {
        switch (state) {
        case 'connect':
          if (hasFailedOnce) {
            growl.success('<h4>WebSocket</h4>' + $filter('translate')(
              gettext('Connected successfully.')) +
            '<refresh-page></refresh-page>', {ttl: 2000})
          }
          break
        case 'disconnect':
          SocketDisconnectedService.open(
            gettext('Socket connection was lost'))
          break
        case 'connect_error':
        case 'error':
          SocketDisconnectedService.open(
            gettext('Error'))
          break
        case 'reconnect_failed':
          SocketDisconnectedService.open(
            gettext('Error while reconnecting'))
          break
        case 'reconnect':
          growl.success('<h4>WebSocket</h4>' + $filter('translate')(
            gettext('Reconnected successfully.')), {ttl: -1})
          break
        }

        scope.$apply(function() {
          scope.socketState = state
        })
      }

      var socketListeners = {
        connect: function() {
          setState('connect')
        }
      , disconnect: function() {
          setState('disconnect')
          hasFailedOnce = true
        }
      , error: function() {
          setState('error')
          hasFailedOnce = true
        }
      , connect_error: function() {
          setState('connect_error')
          hasFailedOnce = true
        }
      , reconnect_error: function() {
          setState('reconnect_error')
          hasFailedOnce = true
        }
      , reconnect_failed: function() {
          setState('reconnect_failed')
          hasFailedOnce = true
        }
      , reconnect: function() {
          setState('reconnect')
          hasFailedOnce = true
        }
      }

      Object.keys(socketListeners).forEach(function(event) {
        socket.on(event, socketListeners[event])
      })

      function unloadListener() {
        // On at least Firefox, the socket connection will close
        // before the page unloads, causing the "socket disconnected"
        // message to display on every unload. To prevent that from
        // happening, let's unbind all the listeners when it's time.
        Object.keys(socketListeners).forEach(function(event) {
          socket.removeListener(event, socketListeners[event])
        })
      }

      $window.addEventListener('beforeunload', unloadListener, false)

      scope.$on('$destroy', function() {
        $window.removeEventListener('beforeunload', unloadListener, false)
      })
    }
  }
}
