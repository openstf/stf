module.exports =
  function DocsCtrl($rootScope, $scope, $window, $location) {

    function hasHistory() {
      return $window.history.length > 1
    }

    $scope.hasHistory = hasHistory()

    $scope.goBack = function() {
      $window.history.back()
    }

    $scope.goHome = function() {
      $location.path('/docs/Help')
    }

    /* eslint no-console:0 */
    $rootScope.$on('$routeChangeError',
      function(event, current, previous, rejection) {
        console.error('ROUTE CHANGE ERROR: ' + rejection)
        console.log('event', event)
        console.log('current', current)
        console.log('previous', previous)
      })
  }
