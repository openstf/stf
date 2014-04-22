var _ = require('lodash')

module.exports = function NavigationCtrl($scope) {

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
}
