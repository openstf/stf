require('./logs.less')

module.exports = angular.module('stf.logs', [
  require('stf/logcat').name
])
  .run(["$templateCache", function ($templateCache) {
    $templateCache.put('control-panes/logs/logs.jade',
      require('./logs.jade')
    )
  }])
  .controller('LogsCtrl', require('./logs-controller'))
