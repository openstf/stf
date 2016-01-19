// TODO: Test this
module.exports = function() {
  return function(scope, element, attrs) {
    scope.$watch(attrs.pageVisible, function() {
      element.bind('load', function() {
        scope.$apply(attrs.pageLoad)
      })
    })
  }
}
