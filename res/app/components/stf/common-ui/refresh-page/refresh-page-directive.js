module.exports = function refreshPageDirective($window) {
  return {
    restrict: 'E',
    replace: true,
    scope: {
    },
    template: require('./refresh-page.jade'),
    link: function(scope) {
      scope.reloadWindow = function() {
        $window.location.reload()
      }
    }
  }
}
