require('./cpu.css')

module.exports = angular.module('stf.cpu', [

])
  .run(['$templateCache', function($templateCache) {
    $templateCache.put('control-panes/cpu/cpu.pug',
      require('./cpu.pug')
    )
  }])
  .controller('CpuCtrl', require('./cpu-controller'))
