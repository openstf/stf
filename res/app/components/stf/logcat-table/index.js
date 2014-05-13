require('./logcat-table.css')

module.exports = angular.module('stf.logcat-table', [

])
  .value('logcatAutoScroll', true)
  .directive('logcatTable', require('./logcat-table-directive'))
