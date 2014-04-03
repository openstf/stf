module.exports = function UploadCtrl($scope, $rootScope, SettingsService, gettext) {

  $scope.installation = null

  $scope.clear = function () {
    $scope.installation = null
  }

  $rootScope.install = function ($files) {
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
              $scope.installation = result
            })
          })
      })
  }

  $scope.progressMessage = function (code) {
    return {
      'pushing_app': gettext('Pushing app...'),
      'installing_app': gettext('Installing app...'),
      'launching_app': gettext('Launching activity...'),
      'success': gettext('Installation complete'),
      'fail': gettext('Installation failed')
    }[code]
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
