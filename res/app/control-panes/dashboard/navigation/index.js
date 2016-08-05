require('./navigation.css')

module.exports = angular.module('stf.navigation', [

])
  .run(['$templateCache', function($templateCache) {
    $templateCache.put('control-panes/dashboard/navigation/navigation.pug',
      require('./navigation.pug')
    )
  }])
  .controller('NavigationCtrl', require('./navigation-controller'))
