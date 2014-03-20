var io = require('socket.io')

module.exports = function SocketFactory($rootScope) {
  var socket = io.connect()

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

  socket.on('connect', function() {
    $rootScope.$apply(function() {
      socket.state = 'connect'
    })
  })

  socket.on('connecting', function() {
    $rootScope.$apply(function() {
      socket.state = 'connecting'
    })
  })

  socket.on('disconnect', function() {
    $rootScope.$apply(function() {
      socket.state = 'disconnect'
    })
  })

  socket.on('connect_failed', function() {
    $rootScope.$apply(function() {
      socket.state = 'connect_failed'
    })
  })

  socket.on('error', function() {
    $rootScope.$apply(function() {
      socket.state = 'error'
    })
  })

  socket.on('reconnect_failed', function() {
    $rootScope.$apply(function() {
      socket.state = 'reconnect_failed'
    })
  })

  socket.on('reconnect', function() {
    $rootScope.$apply(function() {
      socket.state = 'reconnect'
    })
  })

  socket.on('reconnecting', function() {
    $rootScope.$apply(function() {
      socket.state = 'reconnecting'
    })
  })

  return socket
}
