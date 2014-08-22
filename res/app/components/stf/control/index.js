module.exports = angular.module('stf/control', [
  require('stf/socket').name,
  require('stf/transaction').name
])
  .factory('ControlService', require('./control-service'))
