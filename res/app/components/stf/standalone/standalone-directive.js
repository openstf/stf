module.exports = function standaloneDirective($rootScope, $window) {
  return {
    restrict: 'AE',
    link: function () {
      $rootScope.standalone = $window.history.length < 2
      //$rootScope.standalone = true
    }
  }
}
