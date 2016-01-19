module.exports = function InstallCtrl(
  $scope
, InstallService
) {
  $scope.accordionOpen = true
  $scope.installation = null

  $scope.clear = function() {
    $scope.installation = null
    $scope.accordionOpen = false
  }

  $scope.$on('installation', function(e, installation) {
    $scope.installation = installation.apply($scope)
  })

  $scope.installUrl = function(url) {
    return InstallService.installUrl($scope.control, url)
  }

  $scope.installFile = function($files) {
    if ($files.length) {
      return InstallService.installFile($scope.control, $files)
    }
  }

  $scope.uninstall = function(packageName) {
    // TODO: After clicking uninstall accordion opens
    return $scope.control.uninstall(packageName)
      .then(function() {
        $scope.$apply(function() {
          $scope.clear()
        })
      })
  }
}
