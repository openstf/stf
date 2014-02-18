module.exports = angular.module('stf/control', [
  require('stf/socket').name
])
  .factory('ControlService', require('./control-service'))