require('./performance.css')

module.exports = angular.module('stf.performance', [

])
  .run(["$templateCache", function ($templateCache) {
    $templateCache.put('control-panes/performance/performance.jade',
      require('./performance.jade')
    )
  }])
  .controller('PerformanceCtrl', require('./performance-controller'))
