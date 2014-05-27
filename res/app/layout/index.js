require('se7en-bootstrap-3/build/stylesheets/bootstrap.min.css')
//require('bootstrap/dist/css/bootstrap.css')

require('se7en-bootstrap-3/build/stylesheets/se7en-font.css')
require('se7en-bootstrap-3/build/stylesheets/style.css')

require('font-awesome-bower/css/font-awesome.css')

require('font-lato-2-subset')
//require('se7en-bootstrap-3/build/stylesheets/font-awesome.min.css')

require('angular-bootstrap')

require('fa-borderlayout')
require('fa-borderlayout/build-0.3.1/borderLayout.css')
require('fa-borderlayout/build-0.3.1/stf-style.css')

require('./cursor.css')
require('./stf-se7en.css')
require('./small.css')
require('./stf-styles.css')

require('angular-loading-bar/src/loading-bar.js')
require('angular-loading-bar/src/loading-bar.css')

module.exports = angular.module('layout', [
  require('stf/basic-mode').name,
  'ui.bootstrap',
  'fa.directive.borderLayout',
  'angular-loading-bar',
  require('stf/common-ui').name,
  require('stf/socket/socket-state').name,
  require('stf/browser-info').name
])
  .config(['$tooltipProvider', function ($tooltipProvider) {
    $tooltipProvider.options({
      appendToBody: true
    })
  }])
  .controller('LayoutCtrl', require('./layout-controller'))

