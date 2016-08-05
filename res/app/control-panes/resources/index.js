require('./resources.css')

module.exports = angular.module('stf.resources', [

])
  .run(['$templateCache', function($templateCache) {
    $templateCache.put('control-panes/resources/resources.pug',
      require('./resources.pug')
    )
  }])
  .controller('ResourcesCtrl', require('./resources-controller'))
