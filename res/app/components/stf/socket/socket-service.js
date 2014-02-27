var io = require('socket.io')

module.exports = function SocketServiceFactory() {
  var socketService = io.connect()

  socketService.scoped = function($scope) {
    var listeners = []

    $scope.$on('$destroy', function() {
      listeners.forEach(function(listener) {
        socketService.removeListener(listener.event, listener.handler)
      })
    })

    return {
      on: function(event, handler) {
        listeners.push({
          event: event
        , handler: handler
        })
        socketService.on(event, handler)
        return this
      }
    }
  }

  return socketService
}
