module.exports = function MenuCtrl($scope, $rootScope, SettingsService,
  $location, ExternalUrlModalService, NativeUrlService) {

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
    var hipChatNativeUrl = 'hipchat://cyberagent.hipchat.com/room/stf'

    var hipChatWebUrl = 'https://cyberagent.hipchat.com/chat?focus_jid=' +
      '44808_stf@conf.hipchat.com&minimal=true'

    NativeUrlService.open({
      nativeUrl: hipChatNativeUrl,
      webUrl: hipChatWebUrl
    })

    //ExternalUrlModalService.open(hipChatUrl, 'HipChat #STF', 'fa-comment')
  }
}
