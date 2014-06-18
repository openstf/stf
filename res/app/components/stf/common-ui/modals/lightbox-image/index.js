require('./lightbox-image.css')

module.exports = angular.module('stf.lightbox-image', [
  require('stf/common-ui/modals/common').name
])
  .factory('LightboxImageService', require('./lightbox-image-service'))
