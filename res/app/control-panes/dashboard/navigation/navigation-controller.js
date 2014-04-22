module.exports = function NavigationCtrl($scope) {
  $scope.activeBrowser = null

  $scope.openURL = function() {
    return $scope.control.openBrowser(
      $scope.textURL
    , $scope.activeBrowser
    )
  }
}
