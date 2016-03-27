require('./performance.css')

module.exports = angular.module('stf.performance', [
  require('./cpu').name
])
  .run(['$templateCache', function($templateCache) {
    $templateCache.put('control-panes/performance/performance.jade',
      require('./performance.jade')
    )
  }])
  .controller('PerformanceCtrl', require('./performance-controller'))
