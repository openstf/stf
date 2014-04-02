module.exports = function UploadCtrl($scope, $rootScope) {

  $scope.installation = null

  $scope.clear = function () {
    $scope.installation = null
  }

  $rootScope.install = function ($files) {

    return $rootScope.control.install($files)
      .then(function (tx) {
        return tx.promise
          .progressed(function (result) {
            $scope.$apply(function () {
              $scope.installation = result
            })
          })
          .then(function (result) {
            $scope.$apply(function () {
              $scope.installation = result
            })
          })
      })
  }
}
