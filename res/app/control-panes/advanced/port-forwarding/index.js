require('./port-forwarding.css')

module.exports = angular.module('stf.port-forwarding', [
  require('stf/common-ui/table').name,
  require('stf/settings').name,
  require('gettext').name,
  require('angular-xeditable').name
])
  .run(function (editableOptions) {
    editableOptions.theme = 'bs3'

  })
  .run(["$templateCache", function ($templateCache) {
    $templateCache.put(
      'control-panes/advanced/port-forwarding/port-forwarding.jade',
      require('./port-forwarding.jade')
    )
  }])
  .controller('PortForwardingCtrl', require('./port-forwarding-controller'))
