module.exports = function UploadCtrl($scope, $rootScope, SettingsService, gettext) {

  $scope.upload = null
  $scope.installation = null
  $scope.installEnabled = true
  $scope.launchEnabled = true

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
      .progressed(function (uploadResult) {
        $scope.$apply(function () {
          $scope.upload = uploadResult
        })
      })
      .then(function (uploadResult) {
        $scope.$apply(function () {
          $scope.upload = uploadResult
        })
        if (uploadResult.success) {
          if ($scope.installEnabled) {
            var install = $rootScope.control.install(uploadResult.body)
            return install.promise
              .progressed(function (installResult) {
                $scope.$apply(function () {
                  installResult.manifest = uploadResult.body.manifest
                  $scope.installation = installResult
                })
              })
              .then(function (installResult) {
                $scope.$apply(function () {
                  installResult.manifest = uploadResult.body.manifest
                  $scope.treeData = installResult.manifest
                  $scope.installation = installResult
                })
              })
          }
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

  $scope.taskFinished = function () {
    if ($scope.installEnabled) {
      if ($scope.upload && $scope.upload.settled &&
        $scope.installation && $scope.installation.settled) {
        return true
      }
    } else {
      if ($scope.upload && $scope.upload.settled) {
        return true
      }
    }
    return false
  }

  $scope.taskProgressMax = function () {
    return $scope.taskProgressMaxDivisor() * 100
  }

  $scope.taskProgressMaxDivisor = function () {
    if ($scope.installEnabled) {
      return 2
    } else {
      return 1
    }
  }

  $scope.taskProgress = function () {
    if ($scope.installEnabled) {
      var sum = 0
      if ($scope.upload) {
        sum += $scope.upload.progress
      }
      if ($scope.installation) {
        sum += $scope.installation.progress
      }
      return sum
    } else {
      if ($scope.upload) {
        return $scope.upload.progress
      }
    }
    return 0
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
