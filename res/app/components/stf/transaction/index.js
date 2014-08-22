module.exports = angular.module('stf/transaction', [
  require('stf/socket').name
])
  .factory('TransactionService', require('./transaction-service'))
