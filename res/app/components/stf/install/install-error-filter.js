// From here: https://github.com/android/platform_frameworks_base/blob/
// master/core/java/android/content/pm/PackageManager.java#L371

var responses = require('./response-codes.json')

module.exports = function installErrorFilter(gettext) {
  return function (text) {
    return gettext(responses[text] || text)
  }
}
