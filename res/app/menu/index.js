require('./menu.css')

module.exports = angular.module('stf.menu', [
  require('stf/nav-menu').name
])
  .run(["$templateCache", function ($templateCache) {
    $templateCache.put('menu.jade', require('./menu.jade'))
  }])
  .controller('MenuCtrl', require('./menu-controller'))
