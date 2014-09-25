require('se7en-bootstrap-3')

require('./cursor.css')
require('./stf-se7en.css')
require('./small.css')
require('./stf-styles.css')

module.exports = angular.module('layout', [
  require('stf/landscape').name,
  require('stf/basic-mode').name,
  require('ui-bootstrap').name,
  require('angular-borderlayout').name,
  require('stf/common-ui').name,
  require('stf/socket/socket-state').name,
  require('stf/browser-info').name
])
  .config(['$tooltipProvider', function ($tooltipProvider) {
    $tooltipProvider.options({
      appendToBody: true
    })
  }])
  .controller('LayoutCtrl', require('./layout-controller'))
