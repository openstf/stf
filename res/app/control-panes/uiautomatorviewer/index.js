require('./uiautomatorviewer.css')

module.exports = angular.module('stf.uiautomatorviewer', [
],function($rootScopeProvider) {
  $rootScopeProvider.digestTtl(50);
})
  .run(['$templateCache', function($templateCache) {
    $templateCache.put('control-panes/uiautomatorviewer/uiautomatorviewer.pug',
      require('./uiautomatorviewer.pug')
    )
  }])
  .controller('UiautomatorviewerCtrl', require('./uiautomatorviewer-controller'))
