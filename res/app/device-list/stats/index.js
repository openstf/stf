require('./device-list-stats.css')

module.exports = angular.module('stf.device-list.stats', [
  require('stf/user').name
])
  .directive('deviceListStats', require('./device-list-stats-directive'))
