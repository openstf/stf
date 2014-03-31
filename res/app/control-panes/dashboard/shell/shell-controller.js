module.exports = function ShellCtrl($scope, $rootScope) {
  $scope.results = []

  $scope.run = function(command) {
    var cmd = $rootScope.control.shell(command)
    return cmd.promise
      .progressed(function(results) {
        $scope.results = results
        $scope.$digest()
      })
      .then(function(results) {
        $scope.results = results
        $scope.$digest()
      })
  }
}
