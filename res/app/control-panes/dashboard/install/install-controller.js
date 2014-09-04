module.exports = function InstallCtrl(
  $scope
, $http
, SettingsService
, StorageService
) {
  $scope.upload = null
  $scope.installation = null
  $scope.installEnabled = true
  $scope.launchEnabled = true

  $scope.clear = function () {
    $scope.upload = null
    $scope.installation = null
  }

  $scope.installUrl = function (url) {
    $scope.upload = {
      progress: 0,
      lastData: 'uploading'
    }

    $scope.installation = null
    return $scope.control.uploadUrl(url)
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

  $scope.installFile = function ($files) {
    $scope.$apply(function () {
      $scope.upload = {
        progress: 0
      , lastData: 'uploading'
      }
    })

    return StorageService.storeFile('apk', $files, {
        filter: function(file) {
          return /\.apk$/i.test(file.name)
        }
      })
      .progressed(function(e) {
        if (e.lengthComputable) {
          $scope.$apply(function () {
            $scope.upload = {
              progress: e.loaded / e.total * 100
            , lastData: 'uploading'
            }
          })
        }
      })
      .then(function(res) {
        $scope.$apply(function () {
          $scope.upload = {
            progress: 100
          , lastData: 'processing'
          }
        })

        var href = res.data.resources.file.href

        return $http.get(href + '/manifest')
          .then(function(res) {
            $scope.upload = {
              progress: 100
            , lastData: 'success'
            , settled: true
            }

            if (res.data.success) {
              return $scope.maybeInstall({
                href: href
              , launch: $scope.launchEnabled
              , manifest: res.data.manifest
              })
            }
          })
      })
      .catch(function(err) {
        $scope.$apply(function () {
          if (err.code === 'no_input_files') {
            $scope.upload = null
          }
          else {
            $scope.upload = {
              progress: 100
            , lastData: 'fail'
            , settled: true
            , error: err.message
            }
          }
        })
      })
  }


  $scope.maybeInstall = function (options) {
    if ($scope.installEnabled) {
      return $scope.control.install(options)
        .progressed(function (installResult) {
          $scope.$apply(function () {
            installResult.manifest = options.manifest
            $scope.installation = installResult
          })
        })
        .then(function (installResult) {
          $scope.$apply(function () {
            $scope.accordionOpen = false
            installResult.manifest = options.manifest
            $scope.treeData = installResult.manifest
            $scope.installation = installResult
            $scope.installationError = installResult.error
          })
        })
    }
    else {
      return Promise.reject(new Error('Installation not enabled'))
    }
  }

  $scope.uninstall = function (packageName) {
    // TODO: After clicking uninstall accordion opens
    return $scope.control.uninstall(packageName)
      .then(function (result) {
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
      return $scope.upload && ($scope.upload.error || $scope.upload.settled &&
        $scope.installation && $scope.installation.settled)
    } else {
      return $scope.upload && $scope.upload.settled
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

  $scope.accordionOpen = true

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
