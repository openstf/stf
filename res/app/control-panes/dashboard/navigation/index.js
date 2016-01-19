require('./navigation.css')

module.exports = angular.module('stf.navigation', [

])
  .run(['$templateCache', function($templateCache) {
    $templateCache.put('control-panes/dashboard/navigation/navigation.jade',
      require('./navigation.jade')
    )
  }])
  .controller('NavigationCtrl', require('./navigation-controller'))
