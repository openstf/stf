require('./basic-mode.css')

module.exports = angular.module('stf.basic-mode', [
])
  .directive('basicMode', require('./basic-mode-directive'))
