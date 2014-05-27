module.exports = function basicModeDirective($rootScope, BrowserInfo) {
  return {
    restrict: 'AE',
    link: function (scope, element, attrs) {
      $rootScope.basicMode = !!BrowserInfo.small // TODO: use .mobile
      if ($rootScope.basicMode) {
        element.addClass('basic-mode')
      }

      if (BrowserInfo.mobile) {
        element.addClass('mobile')
      }
    }
  }
}
