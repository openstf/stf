module.exports = function standaloneDirective($rootScope) {
  return {
    restrict: 'AE',
    link: function () {
      //$rootScope.standalone = $window.history.length < 2
      // Disable standalone for now
      $rootScope.standalone = false
    }
  }
}
