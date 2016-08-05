require('./input.css')

module.exports = angular.module('stf.advanced.input', [
])
  .run(['$templateCache', function($templateCache) {
    $templateCache.put('control-panes/advanced/input/input.pug',
      require('./input.pug')
    )
  }])
  .controller('InputAdvancedCtrl', require('./input-controller'))
