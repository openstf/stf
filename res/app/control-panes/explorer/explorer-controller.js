module.exports = function ExplorerCtrl($scope) {
  $scope.search = ''
  $scope.files = []
  $scope.paths = []

  var listDir = function () {
    var path = '/' + $scope.paths.join('/')
    $scope.control.fslist(path)
      .then(function (result) {
        $scope.files = result.body;
        $scope.$digest();
      })
      .catch(function (err) {
        alert(err.message);
      })
  }

  $scope.dirEnter = function (name) {
    if (name) {
      $scope.paths.push(name)
    }
    listDir()
    $scope.search = ''
  }

  $scope.dirJump = function () {
    if ($scope.paths.length !== 0) {
      $scope.paths.pop()
    }
    listDir()
  }

  $scope.getFile = function (file) {
    var path = '/' + $scope.paths.join('/') + '/' + file
    $scope.control.fsretrieve(path)
      .then(function (result) {
        location.href = result.body.href + "?download"
      })
      .catch(function (err) {
        alert(err.message)
      })
  }

  // Initialize
  listDir($scope.dir)
}
