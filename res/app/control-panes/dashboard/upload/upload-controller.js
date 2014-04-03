module.exports = function UploadCtrl($scope, $rootScope, SettingsService) {

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
