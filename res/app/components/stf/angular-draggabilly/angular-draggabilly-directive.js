module.exports =
  function angularDraggabillyDirective(DraggabillyService, $parse) {
    return {
      restrict: 'AE',
      link: function(scope, element, attrs) {
        var parsedAttrs = $parse(attrs.angularDraggabilly)()
        if (typeof parsedAttrs !== 'object') {
          parsedAttrs = {}
        }

        var options = angular.extend({
        }, parsedAttrs)

        /* eslint no-unused-vars: 0 */
        var draggie = new DraggabillyService(element[0], options)
      }
    }
  }
