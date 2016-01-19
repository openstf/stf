require('./advanced.css')

module.exports = angular.module('stf.advanced', [
  require('./input').name,
//  require('./run-js').name,
//  require('./usb').name,
//  require('./vnc').name,
  require('./port-forwarding').name,
  require('./maintenance').name
])
  .run(['$templateCache', function($templateCache) {
    $templateCache.put('control-panes/advanced/advanced.jade',
      require('./advanced.jade')
    )
  }])
  .controller('AdvancedCtrl', require('./advanced-controller'))
