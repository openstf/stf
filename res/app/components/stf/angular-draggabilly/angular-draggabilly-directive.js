module.exports = function angularDraggabillyDirective(DraggabillyService) {
  return {
    restrict: 'AE',
    link: function (scope, element, attrs) {
      var parsedAttrs = $parse(attrs.angularDraggabilly)()
      if (typeof parsedAttrs !== 'object') {
        parsedAttrs = {}
      }

      var options = angular.extend({
      }, parsedAttrs)

      var draggie = new DraggabillyService(element[0], options)
    }
  }
}
