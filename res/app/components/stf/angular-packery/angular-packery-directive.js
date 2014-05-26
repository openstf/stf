var _ = require('lodash')

module.exports = function angularPackeryDirective(PackeryService, DraggabillyService, $timeout, $parse) {
  return {
    restrict: 'AE',
    link: function (scope, element, attrs) {
      var container = element[0]
      var pckry
      var parsedAttrs = $parse(attrs.angularPackery)()
      if (typeof parsedAttrs !== 'object') {
        parsedAttrs = {}
      }

      var options = angular.extend({
        itemSelector: '.packery-item',
        columnWidth: '.packery-item',
        transitionDuration: '300ms'
      }, parsedAttrs)

      $timeout(function () {
        pckry = new PackeryService(container, options)
        pckry.on('layoutComplete', onLayoutComplete)
        pckry.layout()
        pckry.bindResize()
        bindDraggable()
      }, 50)

      function bindDraggable() {
        if (options.draggable) {
          var draggableOptions = {}
          if (options.draggableHandle) {
            draggableOptions.handle = options.draggableHandle
          }
          var itemElems = pckry.getItemElements()
          for (var i = 0, len = itemElems.length; i < len; ++i) {
            var elem = itemElems[i]
            var draggie = new DraggabillyService(elem, draggableOptions)
            pckry.bindDraggabillyEvents(draggie)
          }
        }
      }

      function onLayoutComplete() {
        return true
      }

      function onPanelsResized() {
        pckry.layout()
      }

      scope.$on('panelsResized', _.throttle(onPanelsResized, 300))

      scope.$on('$destroy', function () {
        if (pckry) {
          pckry.unbindResize()
          pckry.off('layoutComplete', onLayoutComplete)
        }
      })
    }
  }
}
