module.exports = function DocsCtrl($rootScope, $scope, $window, $location) {

  $scope.goBack = function () {
    $window.history.back()
  }

  $scope.goHome = function () {
    $location.path('/docs/en/index')
  }

  $rootScope.$on("$routeChangeError",
    function (event, current, previous, rejection) {
      console.log("ROUTE CHANGE ERROR: " + rejection)
      console.log('event', event)
      console.log('current', current)
      console.log('previous', previous)

    })
}
