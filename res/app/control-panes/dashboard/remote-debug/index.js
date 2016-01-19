require('./remote-debug.css')

module.exports = angular.module('stf.remote-debug', [
  require('gettext').name
])
  .run(['$templateCache', function($templateCache) {
    $templateCache.put(
      'control-panes/advanced/remote-debug/remote-debug.jade',
      require('./remote-debug.jade')
    )
  }])
  .controller('RemoteDebugCtrl', require('./remote-debug-controller'))
