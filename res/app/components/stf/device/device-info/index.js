module.exports = angular.module('stf.device-status', [])
  .filter('statusName', function (gettext) {
    return function (text) {
      return {
        'absent': gettext('Absent'),
        'present': gettext('Present'),
        'offline': gettext('Offline'),
        'unauthorized': gettext('Unauthorized'),
        'preparing': gettext('Preparing'),
        'ready': gettext('Ready'),
        'using': gettext('Using'),
        'busy': gettext('Busy'),
        'available': gettext('Use')
      }[text] || gettext('Unknown')
    }
  })
  .filter('batteryHealth', function (gettext) {
    return function (text) {
      return {
        'cold': gettext('Cold'),
        'good': gettext('Good'),
        'dead': gettext('Dead'),
        'over_voltage': gettext('Over Voltage'),
        'overheat': gettext('Overheat'),
        'unspecified_failure': gettext('Unspecified Failure')
      }[text] || gettext('-')
    }
  })
  .filter('batterySource', function (gettext) {
    return function (text) {
      return {
        'ac': gettext('AC'),
        'usb': gettext('USB'),
        'wireless': gettext('Wireless')
      }[text] || gettext('-')
    }
  })
  .filter('batteryStatus', function (gettext) {
    return function (text) {
      return {
        'charging': gettext('Charging'),
        'discharging': gettext('Discharging'),
        'full': gettext('Full'),
        'not_charging': gettext('Not Charging')
      }[text] || gettext('-')
    }
  })
