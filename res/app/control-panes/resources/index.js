require('./resources.css')

module.exports = angular.module('stf.resources', [

])
  .run(['$templateCache', function($templateCache) {
    $templateCache.put('control-panes/resources/resources.jade',
      require('./resources.jade')
    )
  }])
  .controller('ResourcesCtrl', require('./resources-controller'))
