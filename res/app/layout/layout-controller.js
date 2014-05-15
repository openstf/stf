module.exports = function LayoutCtrl(FatalMessageService, BrowserInfo, $rootScope) {

  $rootScope.basicMode = false
  if (BrowserInfo.small) {
    $rootScope.basicMode = true
  } else {
    $rootScope.basicMode = false
  }

}
