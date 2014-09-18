module.exports = angular.module('stf.device-list.column', [
  require('gettext').name
])
  .service('DeviceColumnService', require('./device-column-service'))
