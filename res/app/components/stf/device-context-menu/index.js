require('./device-context-menu.css')

module.exports = angular.module('stf.device-context-menu', [
  require('ng-context-menu').name
])
  .directive('deviceContextMenu', require('./device-context-menu-directive'))
