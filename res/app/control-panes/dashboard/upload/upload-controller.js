module.exports = function UploadCtrl($scope, $rootScope, SettingsService, gettext) {

  $scope.installation = null

  $scope.clear = function () {
    $scope.installation = null
  }

  $rootScope.install = function ($files) {
    $scope.installation = {
      progress: 0,
      lastData: 'uploading'
    }

    return $rootScope.control.install($files)
      .then(function (tx) {
        var manifest = tx.manifest
        return tx.promise
          .progressed(function (result) {
            $scope.$apply(function () {
              result.manifest = manifest
              $scope.installation = result
            })
          })
          .then(function (result) {
            $scope.$apply(function () {
              result.manifest = manifest
              $scope.treeData = manifest
              $scope.installation = result
            })
          })
      })
  }

  $scope.uninstall = function (packageName) {
    var tx = $rootScope.control.uninstall(packageName)
    return tx.promise.then(function (result) {
      if (result.success) {
        //$scope.clear()
      } else {
        console.error(result.error)
      }
    })
  }

//
//  $scope.installEnabled = true
//  SettingsService.bind($scope, {
//    key: 'installEnabled',
//    storeName: 'Upload'
//  })
//
//  //$scope.launchEnabled = true
//  SettingsService.bind($scope, {
//    key: 'launchEnabled',
//    storeName: 'Upload'
//  })

}
