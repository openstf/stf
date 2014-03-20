module.exports = function SocketStateDirectiveFactory(socket) {
  return {
    restrict: 'E'
  , template: require('./socket-state.jade')
  , scope: {
    }
  , link: function (scope) {
      scope.$watch(
        function() {
          return socket.state
        }
      , function(state) {
          scope.state = state
        }
      )
    }
  }
}
