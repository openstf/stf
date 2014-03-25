module.exports = function MenuCtrl($scope) {

  $scope.isActive = function (viewLocation) {
    var pattern = '/' + viewLocation,
      re = new RegExp(pattern);
    return re.test($location.path());
  };

  $scope.isActive = function (path) {
    console.log($location.path())
    console.log($location.path().substr(0, path.length))

    return $location.path().substr(0, path.length) == path;
  }

}
