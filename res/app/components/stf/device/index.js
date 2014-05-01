module.exports = angular.module('stf/device', [
  require('./device-info').name
])
  .factory('DeviceService', require('./device-service'))
