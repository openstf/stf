var _ = require('lodash')

module.exports = function BrowserCtrl($scope, $rootScope) {

  function setCurrentBrowser(device) {
    if (device && device.browser && device.browser.apps) {
      var currentBrowser = {}
      if (device.browser.selected) {
        var selectedBrowser = _.first(device.browser.apps, 'selected')
        if (!_.isEmpty(selectedBrowser)) {
          currentBrowser = selectedBrowser[0]
        }
      } else {
        currentBrowser = _.first(device.browser.apps)
      }
      $rootScope.browser = currentBrowser
    }
  }

  setCurrentBrowser($scope.device)

  $scope.$watch('device', function (newValue, oldValue) {
    if (newValue !== oldValue) {
      setCurrentBrowser(newValue)
    }
  })

  $scope.clearSettings = function () {
    var browser = $scope.browser
    $scope.control.clearBrowser(browser)
  }

}
