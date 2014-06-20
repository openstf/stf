require('./external-url-modal.css')

module.exports = angular.module('stf.external-url-modal', [
  require('stf/common-ui/modals/common').name
])
  .factory('ExternalUrlModalService', require('./external-url-modal-service'))
  .directive('onLoadEvent', require('./on-load-event-directive'))
