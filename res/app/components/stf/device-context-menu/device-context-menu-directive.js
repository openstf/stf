module.exports = function deviceContextMenuDirective($window) {
  return {
    restrict: 'EA',
    replace: false,
    //scope: {
    //  control: '&',
    //  device: '&'
    //},
    transclude: true,
    template: require('./device-context-menu.jade'),
    link: function(scope) {
      //var device = scope.device()
      //var control = scope.control()
      scope.windowClose = function() {
        $window.close()
      }

      scope.saveScreenShot = function() {
        scope.control.screenshot().then(function(result) {
          location.href = result.body.href + '?download'
        })
      }

    }
  }
}
