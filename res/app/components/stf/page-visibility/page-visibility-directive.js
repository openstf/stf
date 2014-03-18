module.exports = function pageVisibilityDirective($document, $rootScope) {
  return {
    restrict: 'A',
    link: function (scope, element, attrs) {

      function pageVisibilityChanged() {
        if (document.hidden) {
          $rootScope.$broadcast('pageHidden')
        } else {
          $rootScope.$broadcast('pageVisible');
          // Application is visible to the user
          // Adjust polling rates and display update for active display mode
        }
      }

      document.addEventListener('visibilitychange', pageVisibilityChanged, false)

      scope.$on('$destroy', function () {
        angular.element(document).unbind('visibilitychange');
      })
    }
  }
}
