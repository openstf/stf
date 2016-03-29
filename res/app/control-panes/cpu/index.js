require('./cpu.css')

module.exports = angular.module('stf.cpu', [

])
  .run(['$templateCache', function($templateCache) {
    $templateCache.put('control-panes/cpu/cpu.jade',
      require('./cpu.jade')
    )
  }])
  .controller('CpuCtrl', require('./cpu-controller'))
