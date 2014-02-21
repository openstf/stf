module.exports = function ShellCommandCtrl($scope) {
  $scope.results = []

  $scope.run = function(command) {
    var cmd = $scope.control.shell(command)
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
