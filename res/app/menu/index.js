require('./menu.css')

module.exports = angular.module('stf.menu', [
  require('stf/nav-menu').name,
  require('stf/settings').name,
  require('stf/common-ui/modals/external-url-modal').name,
  require('stf/native-url').name
])
  .controller('MenuCtrl', require('./menu-controller'))
  .run(['$templateCache', function($templateCache) {
    $templateCache.put('menu.jade', require('./menu.jade'))
  }])
