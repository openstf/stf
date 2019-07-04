module.exports = angular.module('stf.add-emulator', [
  require('gettext').name,
  require('stf/common-ui').name,
  require('stf/emulator').name
])
  .directive('addEmulator', require('./add-emulator-directive'))
