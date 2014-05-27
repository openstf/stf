module.exports = function ScreenshotsCtrl($scope, SettingsService) {
  $scope.screenshots = []
  $scope.shotSizeRange = 200

  $scope.clear = function () {
    $scope.screenshots = []
  }

//  SettingsService.bind($scope, {
//    key: 'shotSize', storeName: 'ScreenShots.shotSize'
//  })

  $scope.shotSizeUrlParameter = function (maxSize) {
    return ($scope.shotSizeRange === maxSize) ? '' :
      '?crop=' + $scope.shotSizeRange + 'x'
  }

  $scope.takeScreenShot = function () {
    $scope.control.screenshot().then(function (result) {
      $scope.$apply(function () {
        $scope.screenshots.unshift(result)
      })
    })
  }

  $scope.zoom = function (param) {
    var newValue = parseInt($scope.shotSizeRange, 10) + param.step
    if (param.min && newValue < param.min) {
      newValue = param.min
    } else
    if (param.max && newValue > param.max) {
      newValue = param.max
    }
    $scope.shotSizeRange = newValue
  }

}
