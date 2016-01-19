require('./run-js.css')

module.exports = angular.module('stf.run-js', [

])
  .run(['$templateCache', function($templateCache) {
    $templateCache.put('control-panes/advanced/run-js/run-js.jade',
      require('./run-js.jade')
    )
  }])
  .controller('RunJsCtrl', require('./run-js-controller'))
