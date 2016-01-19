require('./angular-packery.css')

require('packery/js/rect.js')
require('packery/js/packer.js')
require('packery/js/item.js')
var packery = require('packery/js/packery.js')

module.exports = angular.module('stf.angular-packery', [
  require('stf/angular-draggabilly').name
])
  .factory('PackeryService', function() {
    return packery
  })
  .directive('angularPackery', require('./angular-packery-directive'))
