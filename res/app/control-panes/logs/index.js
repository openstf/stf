require('./logs.less')

module.exports = angular.module('stf.logs', [

])
  .run(["$templateCache", function ($templateCache) {
    $templateCache.put('control-panes/logs/logs.jade',
      require('./logs.jade')
    )
  }])
  .controller('LogsCtrl', require('./logs-controller'))
