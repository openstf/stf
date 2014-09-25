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
    link: function (scope, element, attrs) {
      //var device = scope.device()
      //var control = scope.control()
      scope.windowClose = function () {
        $window.close()
      }

    }
  }
}
