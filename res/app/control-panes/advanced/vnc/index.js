require('./vnc.css')

module.exports = angular.module('stf.vnc', [
  require('gettext').name
])
  .run(['$templateCache', function($templateCache) {
    $templateCache.put(
      'control-panes/advanced/vnc/vnc.pug',
      require('./vnc.pug')
    )
  }])
  .controller('VNCCtrl', require('./vnc-controller'))
