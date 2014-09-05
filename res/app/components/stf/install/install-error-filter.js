// From here: https://github.com/android/platform_frameworks_base/blob/
// master/core/java/android/content/pm/PackageManager.java#L371

var responses = require('./response-codes.json')

module.exports = function installErrorFilter(gettext) {
  return function (text) {
    switch (text) {
      case 'INSTALL_ERROR_UNKNOWN':
        return gettext('Installation failed due to an unknown error.')
      case 'INSTALL_ERROR_TIMEOUT':
        return gettext('Installation timed out.')
      default:
        return gettext(responses[text] || text)
    }
  }
}
