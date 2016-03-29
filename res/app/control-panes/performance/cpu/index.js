require('./cpu.css')

module.exports = angular.module('stf.cpu', [
  require('epoch').name
])
  .run(['$templateCache', function($templateCache) {
    $templateCache.put('control-panes/performance/cpu/cpu.jade',
      require('./cpu.jade')
    )
  }])
  .controller('CpuCtrl', require('./cpu-controller'))
