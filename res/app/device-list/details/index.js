require('./device-list-details.css')

module.exports = angular.module('stf.device-list.details', [
  require('stf/device').name,
  require('stf/user/group').name,
  require('stf/common-ui').name,
  require('stf/admin-mode').name,
  require('../column').name,
  require('../empty').name
])
  .directive('deviceListDetails', require('./device-list-details-directive'))
