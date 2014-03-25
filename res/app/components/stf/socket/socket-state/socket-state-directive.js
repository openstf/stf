module.exports = function SocketStateDirectiveFactory() {
  return {
    restrict: 'EA',
    template: require('./socket-state.jade'),
    controller: 'SocketStateCtrl',
    scope: {
    }
  }
}
