module.exports = function ShellCtrl($scope) {
  $scope.result = null

  $scope.run = function(command) {
    if (command === 'clear') {
      $scope.clear()
      return
    }
    console.log("command");
    $scope.command = ''

    return $scope.control.shell(command)
      .progressed(function(result) {
        $scope.result = result
        $scope.data = result.data.join('')
        $scope.$digest()
      })
      .then(function(result) {
        $scope.result = result
        $scope.data = result.data.join('')
        $scope.$digest()
      })
  }

  $scope.touch = function(filepath){
    console.log(filepath);
    // $scope.$digest();
    return;
  }

  $scope.clear = function () {
    $scope.command = ''
    $scope.data = ''
    $scope.result = null
  }
}
