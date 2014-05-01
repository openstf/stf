module.exports = function ShellCtrl($scope, gettext) {
  // TODO: implement multiple devices
//  $scope.results = []
  $scope.result = null

  $scope.referenceUrl = 'https://github.com/jackpal/Android-Terminal-Emulator/wiki/Android-Shell-Command-Reference'

  $scope.run = function(command) {
    if (command === 'clear') {
      $scope.clear()
      return
    }

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

  $scope.clear = function () {
    $scope.command = ''
    $scope.data = ''
    $scope.result = null
  }
}
