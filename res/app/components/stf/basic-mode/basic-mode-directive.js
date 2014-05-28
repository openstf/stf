module.exports = function basicModeDirective($rootScope, BrowserInfo) {
  return {
    restrict: 'AE',
    link: function (scope, element) {
      $rootScope.basicMode = !!BrowserInfo.mobile // CHECK: use .mobile instead of .small
      if ($rootScope.basicMode) {
        element.addClass('basic-mode')
      }

      if (BrowserInfo.mobile) {
        element.addClass('mobile')
      }
    }
  }
}
