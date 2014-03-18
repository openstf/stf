require('./menu.css')

module.exports = angular.module('stf.menu', [
])
  .run(["$templateCache", function ($templateCache) {
    $templateCache.put('menu.jade', require('./menu.jade'))
  }])
  .controller('MenuCtrl', require('./menu-controller'))
