module.exports = function niceTabsDirective() {
  return {
    restrict: 'EA',
    replace: true,
    template: require('./nice-tabs.jade'),
    link: function(scope, element, attrs) {
      // TODO: add support for 'key' for saving in Settings
      // TODO: add support for 'direction=below' for below tabs

      scope.$watch(attrs.tabs, function(newValue) {
        scope.tabs = newValue
      })

      scope.$watch(attrs.filter, function(newValue) {
        scope.filter = newValue
      })

      scope.tabFound = function(tab) {
        if (!tab.filters) {
          return true
        }
        var found = false

        angular.forEach(tab.filters, function(value) {
          if (value === scope.filter) {
            found = true
          }
        })
        return found
      }
    }
  }
}
