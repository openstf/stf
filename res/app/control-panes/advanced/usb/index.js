require('./usb.css')

module.exports = angular.module('stf.usb', [

])
  .run(['$templateCache', function($templateCache) {
    $templateCache.put('control-panes/advanced/usb/usb.jade',
      require('./usb.jade')
    )
  }])
  .controller('UsbCtrl', require('./usb-controller'))
