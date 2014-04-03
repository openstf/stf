module.exports = function UploadCtrl($scope, $rootScope) {

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
}
