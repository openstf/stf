require('./input.css')

module.exports = angular.module('stf.advanced.input', [
  require('stf/keycodes').name
])
  .run(["$templateCache", function ($templateCache) {
    $templateCache.put('control-panes/advanced/input/input.jade',
      require('./input.jade')
    )
  }])
  .controller('InputAdvancedCtrl', require('./input-controller'))
