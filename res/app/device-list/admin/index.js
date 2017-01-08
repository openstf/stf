require('./device-list-admin.css')

module.exports = angular.module('stf.device-list.admin', [
  require('gettext').name,
  require('stf/user/group').name,
  require('stf/common-ui').name,
  require('../column').name,
  require('../empty').name,
  require('stf/standalone').name
])
  .directive('deviceListAdmin', require('./device-list-admin-directive'))

