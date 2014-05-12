module.exports = function ClipboardCtrl($scope, gettext) {
  $scope.clipboardContent = null

  $scope.getClipboardContent = function () {

    $scope.control.copy().then(function (result) {
      $scope.$apply(function () {
        if (result.success) {
          if (result.lastData) {
            $scope.clipboardContent = result.lastData
          } else {
            $scope.clipboardContent = gettext('No clipboard data')
          }
        } else {
          $scope.clipboardContent = gettext('Error while getting data')
        }
      })
    })
  }
}
