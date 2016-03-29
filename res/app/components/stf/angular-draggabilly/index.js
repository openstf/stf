var draggabilly = require('draggabilly')

module.exports = angular.module('stf.angular-draggabilly', [

])
  .factory('DraggabillyService', function() {
    return draggabilly
  })
  .directive('angularDraggabilly', require('./angular-draggabilly-directive'))
