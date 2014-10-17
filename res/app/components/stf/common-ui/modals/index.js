module.exports = angular.module('stf.modals', [
  require('./fatal-message').name,
  require('./socket-disconnected').name,
  require('./version-update').name,
  require('./add-adb-key-modal').name
])
