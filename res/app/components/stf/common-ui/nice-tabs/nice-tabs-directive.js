module.exports = function niceTabsDirective() {
  return {
    restrict: 'EA',
    replace: true,
    scope: {
      tabs: '=',
      filter: '='
    },
    template: require('./nice-tabs.jade'),
    link: function (scope, element, attrs) {
      // TODO: add support for 'key' for saving in localstorage
      // TODO: add support for 'direction=below' for below tabs
      scope.$watch('tabs', function (newValue, oldValue) {
        if (newValue !== oldValue) {
          scope.tabs = newValue
        }
      })

      scope.$watch('filter', function (newValue, oldValue) {
        if (newValue !== oldValue) {
          scope.filter = newValue
        }
      })

      scope.tabFound = function (tab) {
        var found = false
        angular.forEach(tab.filters, function (value) {
          if (value === scope.filter) {
            found = true
          }
        })
        return found
      }
    }
  }
}
