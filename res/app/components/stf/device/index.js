module.exports = angular.module('stf/device', [
  require('./device-info-filter').name
])
  .factory('DeviceService', require('./device-service'))
