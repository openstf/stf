module.exports = angular.module('stf/device', [
  require('./device-info-filter').name,
  require('./enhance-device').name
])
  .factory('DeviceService', require('./device-service'))
  .factory('StateClassesService', require('./state-classes-service'))
