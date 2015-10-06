//window.EXCLUDE_TEMPLATES = true
module.exports = angular.module('stf.device-booking', [
  require('stf/common-ui/modals/common').name,
  require('mwl.calendar').name,
  require('stf/device-schedule').name
])
  .factory('DeviceBookingService', require('./device-booking-service'))
