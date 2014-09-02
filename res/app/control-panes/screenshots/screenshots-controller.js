module.exports = function ScreenshotsCtrl($scope) {
  $scope.screenshots = []
  $scope.screenShotSize = 200

  $scope.clear = function () {
    $scope.screenshots = []
  }

  //SettingsService.bind($scope, {
  //  target: 'screenShotSize',
  //  defaultValue: 200
  //})

  $scope.shotSizeUrlParameter = function (maxSize) {
    return ($scope.screenShotSize === maxSize) ? '' :
    '?crop=' + $scope.screenShotSize + 'x'
  }

  $scope.takeScreenShot = function () {
    $scope.control.screenshot().then(function (result) {
      $scope.$apply(function () {
        $scope.screenshots.unshift(result)
      })
    })
  }

  $scope.zoom = function (param) {
    var newValue = parseInt($scope.screenShotSize, 10) + param.step
    if (param.min && newValue < param.min) {
      newValue = param.min
    } else if (param.max && newValue > param.max) {
      newValue = param.max
    }
    $scope.screenShotSize = newValue
  }

}
