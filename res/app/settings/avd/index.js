require('./avd.css')

module.exports = angular.module('stf.settings.avd', [
  require('./emulators').name
])
  .run(['$templateCache', function($templateCache) {
    $templateCache.put(
      'settings/avd/avd.pug', require('./avd.pug')
    )
  }])
  .controller('AVDCtrl', require('./avd-controller'))
