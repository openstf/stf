require('se7en-bootstrap-3/build/stylesheets/bootstrap.min.css')
require('se7en-bootstrap-3/build/stylesheets/se7en-font.css')
require('se7en-bootstrap-3/build/stylesheets/style.css')
require('se7en-bootstrap-3/build/stylesheets/font-awesome.min.css')


require('fa-borderlayout')
require('fa-borderlayout/build-0.3.1/borderLayout.css')
require('fa-borderlayout/build-0.3.1/stf-style.css')


require('./cursor.css')
require('./stf-se7en.css')
require('./stf-styles.css')
require('./small.css')

module.exports = angular.module('layout', [
  'fa.directive.borderLayout',
  require('stf/common-ui').name,
  require('stf/socket/socket-state').name
])
  .controller('LayoutCtrl', require('./layout-controller'))
