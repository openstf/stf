// From here: https://github.com/android/platform_frameworks_base/blob/
// master/core/java/android/content/pm/PackageManager.java#L371

module.exports = function installErrorFilter(gettext) {
  return function (text) {
    return {
      INSTALL_FAILED_OLDER_SDK: gettext('New package failed because the ' +
      'current SDK version is older than that required by the package')
      // TODO: do the rest
    }[text] || text
  }
}
