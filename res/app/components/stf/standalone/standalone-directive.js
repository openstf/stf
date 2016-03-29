module.exports = function standaloneDirective($rootScope, $location) {
  return {
    restrict: 'AE',
    link: function() {
      //$rootScope.standalone = $window.history.length < 2
      var standalone = $location.search().standalone
      $rootScope.standalone = standalone
    }
  }
}
