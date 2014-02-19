module.exports = angular.module('device-screen-controller', [
  require('stf/screen/scaling').name
])
  .controller('DeviceScreenCtrl', require('./device-screen-controller'))
