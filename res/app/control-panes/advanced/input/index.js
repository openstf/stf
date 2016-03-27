require('./input.css')

module.exports = angular.module('stf.advanced.input', [
])
  .run(['$templateCache', function($templateCache) {
    $templateCache.put('control-panes/advanced/input/input.jade',
      require('./input.jade')
    )
  }])
  .controller('InputAdvancedCtrl', require('./input-controller'))
