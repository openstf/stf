require('./port-forwarding.css')

module.exports = angular.module('stf.port-forwarding', [
])
  .run(["$templateCache", function ($templateCache) {
    $templateCache.put(
      'control-panes/advanced/port-forwarding/port-forwarding.jade',
      require('./port-forwarding.jade')
    )
  }])
  .controller('PortForwardingCtrl', require('./port-forwarding-controller'))
