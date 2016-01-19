require('nine-bootstrap')

require('./cursor.css')
require('./small.css')
require('./stf-styles.css')

module.exports = angular.module('layout', [
  require('stf/landscape').name,
  require('stf/basic-mode').name,
  require('ui-bootstrap').name,
  require('angular-borderlayout').name,
  require('stf/common-ui').name,
  require('stf/socket/socket-state').name,
  require('stf/common-ui/modals/socket-disconnected').name,
  require('stf/browser-info').name
])
  .config(['$uibTooltipProvider', function($uibTooltipProvider) {
    $uibTooltipProvider.options({
      appendToBody: true,
      animation: false
    })
  }])
  .controller('LayoutCtrl', require('./layout-controller'))
