require('./vnc.css')

module.exports = angular.module('stf.vnc', [
  require('gettext').name
])
  .run(['$templateCache', function($templateCache) {
    $templateCache.put(
      'control-panes/advanced/vnc/vnc.jade',
      require('./vnc.jade')
    )
  }])
  .controller('VNCCtrl', require('./vnc-controller'))
