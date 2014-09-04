module.exports = angular.module('stf/transaction', [
  require('stf/socket').name
])
  .constant('TransactionError', require('./transaction-error'))
  .factory('TransactionService', require('./transaction-service'))
