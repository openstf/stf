require('./error-message.css')

module.exports = angular.module('stf.error-message', [

])
  .directive('errorMessage', require('./error-message-directive'))
