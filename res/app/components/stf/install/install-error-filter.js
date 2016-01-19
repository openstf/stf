module.exports = function installErrorFilter(gettext) {
  /* eslint max-len:0 */
  return function(text) {
    switch (text) {
      // Our error codes.
      case 'INSTALL_SUCCEEDED':
        return gettext('Installation succeeded.')
      case 'INSTALL_ERROR_UNKNOWN':
        return gettext('Installation failed due to an unknown error.')
      case 'INSTALL_ERROR_TIMEOUT':
        return gettext('Installation timed out.')
      case 'INSTALL_CANCELED_BY_USER': // Found on Xiaomi devices
        return gettext('Installation canceled by user.')
      // Android PackageManager error codes from [1].
      // [1] https://github.com/android/platform_frameworks_base/blob/
      //     master/core/java/android/content/pm/PackageManager.java
      case 'INSTALL_FAILED_ALREADY_EXISTS':
        return gettext('The package is already installed.')
      case 'INSTALL_FAILED_INVALID_APK':
        return gettext('The package archive file is invalid.')
      case 'INSTALL_FAILED_INVALID_URI':
        return gettext('The URI passed in is invalid.')
      case 'INSTALL_FAILED_INSUFFICIENT_STORAGE':
        return gettext("The package manager service found that the device didn't have enough storage space to install the app.")
      case 'INSTALL_FAILED_DUPLICATE_PACKAGE':
        return gettext('A package is already installed with the same name.')
      case 'INSTALL_FAILED_NO_SHARED_USER':
        return gettext('The requested shared user does not exist.')
      case 'INSTALL_FAILED_UPDATE_INCOMPATIBLE':
        return gettext("A previously installed package of the same name has a different signature than the new package (and the old package's data was not removed).")
      case 'INSTALL_FAILED_MISSING_SHARED_LIBRARY':
        return gettext('The new package uses a shared library that is not available.')
      case 'INSTALL_FAILED_REPLACE_COULDNT_DELETE':
        return gettext('The existing package could not be deleted.')
      case 'INSTALL_FAILED_DEXOPT':
        return gettext('The new package failed while optimizing and validating its dex files, either because there was not enough storage or the validation failed.')
      case 'INSTALL_FAILED_OLDER_SDK':
        return gettext('The new package failed because the current SDK version is older than that required by the package.')
      case 'INSTALL_FAILED_CONFLICTING_PROVIDER':
        return gettext('The new package failed because it contains a content provider with thesame authority as a provider already installed in the system.')
      case 'INSTALL_FAILED_NEWER_SDK':
        return gettext('The new package failed because the current SDK version is newer than that required by the package.')
      case 'INSTALL_FAILED_TEST_ONLY':
        return gettext('The new package failed because it has specified that it is a test-only package and the caller has not supplied the INSTALL_ALLOW_TEST flag.')
      case 'INSTALL_FAILED_CPU_ABI_INCOMPATIBLE':
        return gettext("The package being installed contains native code, but none that is compatible with the device's CPU_ABI.")
      case 'INSTALL_FAILED_MISSING_FEATURE':
        return gettext('The new package uses a feature that is not available.')
      case 'INSTALL_FAILED_CONTAINER_ERROR':
        return gettext("A secure container mount point couldn't be accessed on external media.")
      case 'INSTALL_FAILED_INVALID_INSTALL_LOCATION':
        return gettext("The new package couldn't be installed in the specified install location.")
      case 'INSTALL_FAILED_MEDIA_UNAVAILABLE':
        return gettext("The new package couldn't be installed in the specified install location because the media is not available.")
      case 'INSTALL_FAILED_VERIFICATION_TIMEOUT':
        return gettext("The new package couldn't be installed because the verification timed out.")
      case 'INSTALL_FAILED_VERIFICATION_FAILURE':
        return gettext("The new package couldn't be installed because the verification did not succeed.")
      case 'INSTALL_FAILED_PACKAGE_CHANGED':
        return gettext('The package changed from what the calling program expected.')
      case 'INSTALL_FAILED_UID_CHANGED':
        return gettext('The new package is assigned a different UID than it previously held.')
      case 'INSTALL_FAILED_VERSION_DOWNGRADE':
        return gettext('The new package has an older version code than the currently installed package.')
      case 'INSTALL_PARSE_FAILED_NOT_APK':
        return gettext("The parser was given a path that is not a file, or does not end with the expected '.apk' extension.")
      case 'INSTALL_PARSE_FAILED_BAD_MANIFEST':
        return gettext('The parser was unable to retrieve the AndroidManifest.xml file.')
      case 'INSTALL_PARSE_FAILED_UNEXPECTED_EXCEPTION':
        return gettext('The parser encountered an unexpected exception.')
      case 'INSTALL_PARSE_FAILED_NO_CERTIFICATES':
        return gettext('The parser did not find any certificates in the .apk.')
      case 'INSTALL_PARSE_FAILED_INCONSISTENT_CERTIFICATES':
        return gettext('The parser found inconsistent certificates on the files in the .apk.')
      case 'INSTALL_PARSE_FAILED_CERTIFICATE_ENCODING':
        return gettext('The parser encountered a CertificateEncodingException in one of the files in the .apk.')
      case 'INSTALL_PARSE_FAILED_BAD_PACKAGE_NAME':
        return gettext('The parser encountered a bad or missing package name in the manifest.')
      case 'INSTALL_PARSE_FAILED_BAD_SHARED_USER_ID':
        return gettext('The parser encountered a bad shared user id name in the manifest.')
      case 'INSTALL_PARSE_FAILED_MANIFEST_MALFORMED':
        return gettext('The parser encountered some structural problem in the manifest.')
      case 'INSTALL_PARSE_FAILED_MANIFEST_EMPTY':
        return gettext('The parser did not find any actionable tags (instrumentation or application) in the manifest.')
      case 'INSTALL_FAILED_INTERNAL_ERROR':
        return gettext('The system failed to install the package because of system issues.')
      case 'INSTALL_FAILED_USER_RESTRICTED':
        return gettext('The system failed to install the package because the user is restricted from installing apps.')
      case 'INSTALL_FAILED_NO_MATCHING_ABIS':
        return gettext('The system failed to install the package because its packaged native code did not match any of the ABIs supported by the system.')
      default:
        return gettext(text)
    }
  }
}
