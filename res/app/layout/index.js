require('se7en-bootstrap-3/build/stylesheets/bootstrap.min.css')
require('se7en-bootstrap-3/build/stylesheets/se7en-font.css')
require('se7en-bootstrap-3/build/stylesheets/style.css')
require('se7en-bootstrap-3/build/stylesheets/font-awesome.min.css')

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
  'ui.bootstrap',
  'fa.directive.borderLayout',
  'angular-loading-bar',
  require('stf/common-ui').name,
  require('stf/socket/socket-state').name,
  require('stf/guest-browser').name
])
  .config(['$tooltipProvider', function ($tooltipProvider) {
    $tooltipProvider.options({
      appendToBody: true
    })
  }])
  .controller('LayoutCtrl', require('./layout-controller'))

