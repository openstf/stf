module.exports = function UploadCtrl($scope, $rootScope, SettingsService, gettext) {

  $scope.upload = null
  $scope.installation = null

  $scope.clear = function () {
    $scope.upload = null
    $scope.installation = null
  }

  $rootScope.install = function ($files) {
    $scope.upload = {
      progress: 0,
      lastData: 'uploading'
    }

    var upload = $rootScope.control.upload($files)
    $scope.installation = null
    return upload.promise
      .progressed(function(uploadResult) {
        $scope.$apply(function() {
          $scope.upload = uploadResult
        })
      })
      .then(function(uploadResult) {
        $scope.$apply(function() {
          $scope.upload = uploadResult
        })
        if (uploadResult.success) {
          var install = $rootScope.control.install(uploadResult.body)
          return install.promise
            .progressed(function(installResult) {
              $scope.$apply(function() {
                installResult.manifest = uploadResult.body.manifest
                $scope.installation = installResult
              })
            })
            .then(function(installResult) {
              $scope.$apply(function() {
                installResult.manifest = uploadResult.body.manifest
                $scope.treeData = installResult.manifest
                $scope.installation = installResult
              })
            })
        }
      })
  }

  $scope.uninstall = function (packageName) {
    var tx = $rootScope.control.uninstall(packageName)
    return tx.promise.then(function (result) {
      if (result.success) {
        $scope.$apply(function () {
          $scope.clear()
        })
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
