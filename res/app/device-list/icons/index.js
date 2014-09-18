require('./device-list-icons.css')

module.exports = angular.module('stf.device-list.icons', [
  require('gettext').name,
  require('stf/user/group').name,
  require('stf/common-ui').name,
  require('../column').name,
  require('../empty').name,
  require('stf/standalone').name
])
  .directive('deviceListIcons', require('./device-list-icons-directive'))
