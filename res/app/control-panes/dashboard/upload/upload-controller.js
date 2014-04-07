module.exports = function UploadCtrl($scope, $rootScope, SettingsService, gettext) {

  $scope.upload = null
  $scope.installation = null
  $scope.installEnabled = true
  $scope.launchEnabled = true

  $scope.clear = function () {
    $scope.upload = null
    $scope.installation = null
  }

  $rootScope.installUrl = function (url) {
    $scope.upload = {
      progress: 0,
      lastData: 'uploading'
    }

    var upload = $rootScope.control.uploadUrl(url)
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
          return $scope.maybeInstall(uploadResult.body)
        }
      })
  }

  $rootScope.installFile = function ($files) {
    $scope.upload = {
      progress: 0,
      lastData: 'uploading'
    }

    var upload = $rootScope.control.uploadFile($files)
    $scope.installation = null
    return upload.promise
      .then(function (uploadResult) {
        $scope.upload = uploadResult
        if (uploadResult.success) {
          return $scope.maybeInstall(uploadResult.body)
        }
      })
  }

  $scope.maybeInstall = function (options) {
    if ($scope.installEnabled) {
      var install = $rootScope.control.install(options)
      return install.promise
        .progressed(function (installResult) {
          $scope.$apply(function () {
            installResult.manifest = options.manifest
            $scope.installation = installResult
          })
        })
        .then(function (installResult) {
          $scope.$apply(function () {
            installResult.manifest = options.manifest
            $scope.treeData = installResult.manifest
            $scope.installation = installResult
          })
        })
    }
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

  $scope.taskProgress = function () {
    var progress = 0
    if ($scope.installEnabled) {
      if ($scope.upload) {
        progress += $scope.upload.progress
      }
      if ($scope.installation) {
        progress += $scope.installation.progress
      }
      progress = Math.floor(progress / 2)
    } else {
      if ($scope.upload) {
        progress = $scope.upload.progress
      }
    }
    return progress
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
