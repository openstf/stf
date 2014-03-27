require('./browser.css')

module.exports = angular.module('stf.browser', [

])
  .run(["$templateCache", function ($templateCache) {
    $templateCache.put('control-panes/dashboard/browser/browser.jade',
      require('./browser.jade')
    )
  }])
  .controller('BrowserCtrl', require('./browser-controller'))
