require('./cpu.css')

module.exports = angular.module('stf.cpu', [
  require('epoch').name
])
  .run(['$templateCache', function($templateCache) {
    $templateCache.put('control-panes/performance/cpu/cpu.pug',
      require('./cpu.pug')
    )
  }])
  .controller('CpuCtrl', require('./cpu-controller'))
