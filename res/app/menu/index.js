require('./menu.css')

module.exports = angular.module('stf.menu', [
  require('stf/nav-menu').name,
  require('stf/settings').name
])
  .controller('MenuCtrl', require('./menu-controller'))
  .run(["$templateCache", function ($templateCache) {
    $templateCache.put('menu.jade', require('./menu.jade'))
  }])
