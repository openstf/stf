module.exports = function UploadCtrl($scope) {

  $scope.installation = null

  $scope.install = function ($files) {
    return $scope.control.install($files)
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
