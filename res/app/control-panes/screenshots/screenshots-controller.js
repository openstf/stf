module.exports = function ScreenshotsCtrl($scope, SettingsService) {
  $scope.screenshots = []
  $scope.shotSize = 'small'

  $scope.clear = function () {
    $scope.screenshots = []
  }

  SettingsService.bind($scope, {
    key: 'shotSize'
  , storeName: 'ScreenShots.shotSize'
  })

  $scope.shotSizeUrlParameter = function () {
    var sizes = {
      'small': '?crop=100x',
      'medium': '?crop=320x',
      'large': '?crop=450x',
      'original': ''
    }
    return sizes[$scope.shotSize]
  }

  $scope.takeScreenShot = function () {
    $scope.control.screenshot().then(function(result) {
      $scope.$apply(function() {
        $scope.screenshots.push(result)
      })
    })
  }
}
