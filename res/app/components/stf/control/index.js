module.exports = angular.module('stf/control', [
  require('stf/socket').name
])
  .factory('TransactionService', require('./transaction-service'))
  .factory('ControlService', require('./control-service'))
