var _ = require('lodash')

module.exports = function NavigationCtrl($scope, $rootScope) {

  $scope.urlHistory = []

  function addToHistory() {
    const HISTORY_LIMIT = 20

    var history = $scope.urlHistory
    history.unshift($scope.textURL)
    if (history.length > HISTORY_LIMIT) {
      history.pop()
    }
    $scope.urlHistory = _.uniq(history)
  }

  function addHttp() {
    if ($scope.textURL.indexOf(':') === -1) {
      $scope.textURL = 'http://' + $scope.textURL
    }
  }

  $scope.openURL = function () {
    addHttp()
    addToHistory()

    return $scope.control.openBrowser(
      $scope.textURL,
      $scope.browser
    )
  }

  $scope.clearHistory = function () {
    $scope.urlHistory = []
  }

  $scope.hasHistory = function () {
    return $scope.urlHistory.length > 0
  }

  $scope.insertURL = function ($url) {
    $scope.textURL = $url
    $scope.openURL()
  }


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
