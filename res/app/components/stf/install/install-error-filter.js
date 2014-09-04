// From here: https://github.com/android/platform_frameworks_base/blob/
// master/core/java/android/content/pm/PackageManager.java#L371

var responses = require('./response-codes.json')

module.exports = function installErrorFilter(gettext) {
  return function (text) {
    switch (text) {
      case 'fail_invalid_app_file':
        return gettext('Uploaded file is not valid.')
      case 'fail_download':
        return gettext('Failed to download specified URL.')
      case 'fail_invalid_url':
        return gettext('The specified URL is invalid.')
      case 'fail':
        return gettext('Upload failed to due unknown error.')
      case 'timeout':
        return gettext('Installation timed out.')
      default:
        return gettext(responses[text] || text)
    }
  }
}
