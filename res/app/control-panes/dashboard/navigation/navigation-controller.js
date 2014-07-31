var _ = require('lodash')

module.exports = function NavigationCtrl($scope, $rootScope) {

  function addHttp(textUrl) {
    if (textUrl.indexOf(':') === -1 && textUrl.indexOf('.') !== -1) {
      return 'http://' + textUrl
    }
    return textUrl
  }

  $scope.openURL = function () {
    return $scope.control.openBrowser(
      addHttp($scope.textURL),
      $scope.browser
    )
  }

  function setCurrentBrowser(browser) {
    if (browser && browser.apps) {
      var currentBrowser = {}
      if (browser.selected) {
        var selectedBrowser = _.first(browser.apps, 'selected')
        if (!_.isEmpty(selectedBrowser)) {
          currentBrowser = selectedBrowser[0]
        }
      } else {
        var defaultBrowser = _.find(browser.apps, {name: 'Browser'})
        if (defaultBrowser) {
          currentBrowser = defaultBrowser
        } else {
          currentBrowser = _.first(browser.apps)
        }
      }
      $rootScope.browser = currentBrowser
    }
  }

  setCurrentBrowser($scope.device ? $scope.device.browser : null)

  $scope.$watch('device.browser', function (newValue, oldValue) {
    if (newValue !== oldValue) {
      setCurrentBrowser(newValue)
    }
  }, true)

  $scope.clearSettings = function () {
    var browser = $scope.browser
    $scope.control.clearBrowser(browser)
  }
}
