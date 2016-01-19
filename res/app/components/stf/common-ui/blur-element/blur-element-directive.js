module.exports = function blurElementDirective($parse, $timeout) {
  return {
    restrict: 'A',
    link: function(scope, element, attrs) {
      var model = $parse(attrs.blurElement)

      scope.$watch(model, function(value) {
        if (value === true) {
          $timeout(function() {
            element[0].blur()
          })
        }
      })

      element.bind('blur', function() {
        scope.$apply(model.assign(scope, false))
      })
    }
  }
}
