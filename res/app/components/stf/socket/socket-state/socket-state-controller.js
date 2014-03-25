module.exports = function ($scope, $element, $attrs, $transclude, socket, growl, gettext) {
  var hasFailedOnce = false

  socket.on('connect', function () {
    $scope.$apply(function () {
      $scope.socketState = 'connect'
    })
  })

  socket.on('connecting', function () {
    $scope.$apply(function () {
      $scope.socketState = 'connecting'
    })
  })

  socket.on('disconnect', function () {
    $scope.$apply(function () {
      $scope.socketState = 'disconnect'
    })
    hasFailedOnce = true
  })

  socket.on('connect_failed', function () {
    $scope.$apply(function () {
      $scope.socketState = 'connect_failed'
    })
    hasFailedOnce = true
  })

  socket.on('error', function () {
    $scope.$apply(function () {
      $scope.socketState = 'error'
    })
    hasFailedOnce = true
  })

  socket.on('reconnect_failed', function () {
    $scope.$apply(function () {
      $scope.socketState = 'reconnect_failed'
    })
    hasFailedOnce = true
  })

  socket.on('reconnect', function () {
    $scope.$apply(function () {
      $scope.socketState = 'reconnect'
    })
    hasFailedOnce = true
  })

  socket.on('reconnecting', function () {
    $scope.$apply(function () {
      $scope.socketState = 'reconnecting'
    })
    hasFailedOnce = true
  })

  $scope.$watch('socketState', function (newValue, oldValue) {
    if (newValue) {
      if (newValue === 'connecting' && oldValue) {
        growl.info(gettext('<h4>WebSocket</h4> Connecting...'), {ttl: 1000})
      } else if (newValue === 'connect' && oldValue === 'connecting') {
        if (hasFailedOnce) {
          growl.success(gettext('<h4>WebSocket</h4> Connected successfully.'), {ttl: 2000})
        }
      } else {
        switch (newValue) {
          case 'disconnect':
            growl.error(gettext('<h4>WebSocket</h4> Disconnected.'), {ttl: 2000})
            break;
          case 'connect_failed':
            growl.error(gettext('<h4>WebSocket</h4> Error while connecting.'), {ttl: 2000})
            break;
          case 'error':
            growl.error(gettext('<h4>WebSocket</h4> Error.'), {ttl: 2000})
            break;
          case 'reconnect_failed':
            growl.error(gettext('<h4>WebSocket</h4> Error while reconnecting.'), {ttl: 2000})
            break;
          case 'reconnect':
            growl.success(gettext('<h4>WebSocket</h4> Reconnected successfully.'), {ttl: 10000})
            break;
          case 'reconnecting':
            growl.info(gettext('<h4>WebSocket</h4> Reconnecting...'), {ttl: 10000})
            break;
        }
      }
    }
  })
}
