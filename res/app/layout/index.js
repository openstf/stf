require('style!raw!se7en-bootstrap-3/build/stylesheets/bootstrap.min.css')
require('style!raw!se7en-bootstrap-3/build/stylesheets/se7en-font.css')
require('style!raw!se7en-bootstrap-3/build/stylesheets/style.css')
require('style!raw!se7en-bootstrap-3/build/stylesheets/font-awesome.min.css')


// Temporary here:
require('fa-borderlayout')
require('fa-borderlayout/build-0.3.1/borderLayout.css')
require('fa-borderlayout/build-0.3.1/stf-style.css')


require('./cursor.css')
require('./stf-se7en.css')
require('style!raw!./stf-styles.css')
require('./small.css')

module.exports = angular.module('layout', [
  'fa.directive.borderLayout'
])
  .controller('LayoutCtrl', require('./layout-controller'))
