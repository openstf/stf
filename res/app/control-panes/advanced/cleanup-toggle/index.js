module.exports = angular.module('stf.advanced.cleanup-toggle', [
  require('gettext').name
])
  .run(['$templateCache', function($templateCache) {
    $templateCache.put('control-panes/advanced/cleanup-toggle/cleanup-toggle.pug',
      require('./cleanup-toggle.pug')
    )
  }])
  .controller('CleanUpToggleCtrl', require('./cleanup-toggle-controller'));
