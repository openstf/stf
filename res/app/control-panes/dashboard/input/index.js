require('./input.css')

module.exports = angular.module('stf.input', [

])
  .run(["$templateCache", function ($templateCache) {
    $templateCache.put('control-panes/dashboard/input/input.jade',
      require('./input.jade')
    )
  }])
  .controller('InputCtrl', require('./input-controller'))
