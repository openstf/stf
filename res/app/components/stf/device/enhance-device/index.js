module.exports = angular.module('stf/device/enhance-device', [
  require('stf/app-state').name
])
  .factory('EnhanceDeviceService', require('./enhance-device-service'))
