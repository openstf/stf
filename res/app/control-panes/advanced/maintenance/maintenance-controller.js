module.exports = function($scope, gettext, $filter) {

  $scope.reboot = function() {
    var config = {
      rebootEnabled: true
    }

    /* eslint no-console: 0 */
    if (config.rebootEnabled) {
      var line1 = $filter('translate')(gettext('Are you sure you want to reboot this device?'))
      var line2 = $filter('translate')(gettext('The device will be unavailable for a moment.'))
      if (confirm(line1 + '\n' + line2)) {
        $scope.control.reboot().then(function(result) {
          console.error(result)
        })
      }
    }
  }

}
