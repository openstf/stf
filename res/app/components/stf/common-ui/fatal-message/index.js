require('./fatal-message.css')

module.exports = angular.module('stf.fatal-message', [

])
  .factory('FatalMessageService', require('./fatal-message-service'))
