module.exports = angular.module('stf.command-executor', [
  require('stf/socket').name
])
  .factory('CommandExecutorService', require('./command-executor-service'))
