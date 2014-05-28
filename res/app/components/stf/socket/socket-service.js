var io = require('socket.io')

module.exports = function SocketFactory($rootScope, VersionUpdateService) {
  var socket = io.connect(null, {
    reconnect: false
  })

  socket.scoped = function($scope) {
    var listeners = []

    $scope.$on('$destroy', function() {
      listeners.forEach(function(listener) {
        socket.removeListener(listener.event, listener.handler)
      })
    })

    return {
      on: function(event, handler) {
        listeners.push({
          event: event
        , handler: handler
        })
        socket.on(event, handler)
        return this
      }
    }
  }

  socket.on('outdated', function () {
    VersionUpdateService.open()
  })

  socket.on('socket.ip', function(ip) {
    $rootScope.$apply(function() {
      socket.ip = ip
    })
  })

  return socket
}
