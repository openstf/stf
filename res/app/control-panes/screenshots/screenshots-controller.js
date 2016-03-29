module.exports = function ScreenshotsCtrl($scope) {
  $scope.screenshots = []
  $scope.screenShotSize = 400

  $scope.clear = function() {
    $scope.screenshots = []
  }

  $scope.shotSizeParameter = function(maxSize, multiplier) {
    var finalSize = $scope.screenShotSize * multiplier
    var finalMaxSize = maxSize * multiplier

    return (finalSize === finalMaxSize) ? '' :
    '?crop=' + finalSize + 'x'
  }

  $scope.takeScreenShot = function() {
    $scope.control.screenshot().then(function(result) {
      $scope.$apply(function() {
        $scope.screenshots.unshift(result)
      })
    })
  }

  $scope.zoom = function(param) {
    var newValue = parseInt($scope.screenShotSize, 10) + param.step
    if (param.min && newValue < param.min) {
      newValue = param.min
    } else if (param.max && newValue > param.max) {
      newValue = param.max
    }
    $scope.screenShotSize = newValue
  }
}
