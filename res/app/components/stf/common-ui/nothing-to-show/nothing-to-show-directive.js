module.exports = function() {
  return {
    restrict: 'EA',
    transclude: true,
    scope: {
      icon: '@',
      message: '@'
    },
    template: require('./nothing-to-show.html'),
    link: function(scope, element, attrs) {
      scope.icon = attrs.icon
      scope.message = attrs.message
    }
  }
}
