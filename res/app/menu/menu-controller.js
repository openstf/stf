module.exports = function MenuCtrl($scope, $rootScope, SettingsService,
  $location, ExternalUrlModalService) {

  SettingsService.bind($scope, {
    target: 'lastUsedDevice'
  })

  SettingsService.bind($rootScope, {
    target: 'platform',
    defaultValue: 'native'
  })

  $scope.$on('$routeChangeSuccess', function () {
    $scope.isControlRoute = $location.path().search('/control') !== -1
  })

  $scope.openChat = function () {
    var hipChatUrl = 'https://cyberagent.hipchat.com/chat?focus_jid=' +
      '44808_stf@conf.hipchat.com&minimal=true'
    ExternalUrlModalService.open(hipChatUrl, 'HipChat #STF', 'fa-comment')
  }
}
