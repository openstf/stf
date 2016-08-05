require('./logs.less')

module.exports = angular.module('stf.logs', [
  require('stf/logcat').name,
  require('stf/logcat-table').name
])
  .run(['$templateCache', function($templateCache) {
    $templateCache.put('control-panes/logs/logs.pug',
      require('./logs.pug')
    )
  }])
  .controller('LogsCtrl', require('./logs-controller'))
