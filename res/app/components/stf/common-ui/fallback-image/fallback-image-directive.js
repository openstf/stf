module.exports = function fallbackImageDirective() {
  return {
    restrict: 'A',
    link: function postLink(scope, element, attrs) {
      element.on('error', function() {
        angular.element(this).attr('src', attrs.fallbackImage)
      })
    }
  }
}
