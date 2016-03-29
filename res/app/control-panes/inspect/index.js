require('./inspect.css')

module.exports = angular.module('stf.inspect', [

])
  .run(['$templateCache', function($templateCache) {
    $templateCache.put('control-panes/inspect/inspect.jade',
      require('./inspect.jade')
    )
  }])
  .controller('InspectCtrl', require('./inspect-controller'))
