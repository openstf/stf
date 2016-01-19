module.exports = function ExplorerCtrl($scope) {
  $scope.explorer = {
    search: '',
    files: [],
    paths: []
  }

  $scope.getAbsolutePath = function() {
    return ('/' + $scope.explorer.paths.join('/')).replace(/\/\/+/g, '/')
  }

  function resetPaths(path) {
    $scope.explorer.paths = path.split('/')
  }

  var listDir = function listDir() {
    var path = $scope.getAbsolutePath()
    $scope.explorer.search = path

    $scope.control.fslist(path)
      .then(function(result) {
        $scope.explorer.files = result.body
        $scope.$digest()
      })
      .catch(function(err) {
        throw new Error(err.message)
      })
  }

  $scope.dirEnterLocation = function() {
    if ($scope.explorer.search) {
      resetPaths($scope.explorer.search)
      listDir()
      $scope.explorer.search = $scope.getAbsolutePath()
    }
  }

  $scope.dirEnter = function(name) {
    if (name) {
      $scope.explorer.paths.push(name)
    }
    listDir()
    $scope.explorer.search = $scope.getAbsolutePath()
  }

  $scope.dirUp = function() {
    if ($scope.explorer.paths.length !== 0) {
      $scope.explorer.paths.pop()
    }
    listDir()
    $scope.explorer.search = $scope.getAbsolutePath()
  }

  $scope.getFile = function(file) {
    var path = $scope.getAbsolutePath() + '/' + file
    $scope.control.fsretrieve(path)
      .then(function(result) {
        if (result.body) {
          location.href = result.body.href + '?download'
        }
      })
      .catch(function(err) {
        throw new Error(err.message)
      })
  }

  // Initialize
  listDir($scope.dir)
}
