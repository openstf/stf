# Changelog

## 3.2.0 (2017-12-06)

### Enhancements

- Android 8.1 is now supported.
- The network column in the device list is now based on a value that gets updated in real time. The format of the column has changed slightly due to this change.
- The `--mute-master` option now accepts the values `never` (default), `inuse` (only when a device is being used), and `always` (mute pre-emptively during setup phase). For backwards compatibility, `--mute-master` with no value maps to `inuse`, and `--no-mute-master` to `never`.
- The battery level and battery temperature columns are now filterable with comparison operators.
- Log output now includes a timestamp.

### Fixes

- Fixed an issue on Windows where our device binaries may have failed to install due to an `Out of fallback locations` error caused by a faulty mode check. Thanks @iqianxing!

## 3.1.0 (2017-08-31)

### Enhancements

- Android 8.0 is now supported. Please note that Android O developer previews are no longer officially supported, though they may or may not still work.

## 3.0.1 (2017-08-21)

### Fixes

- Updated [adbkit](https://github.com/openstf/adbkit) to fix `RangeError: Index out of range` errors when parsing newer APKs that use UTF-8 encoding for their string pools.

## 3.0.0 (2017-08-09)

### Enhancements

- Added support for Android O Developer Preview 1 (note that any later previews are not supported yet)
- You can now set screen JPEG quality with the `SCREEN_JPEG_QUALITY` environment variable at launch time. Can be useful for slow networks.
- Switched to [yargs](http://yargs.js.org) for option parsing to make it easier to modify the CLI.
- Almost all command line options can now be specified with environment variables.
- Internal commands are now hidden from help output but can still be used.
- Running the `stf` binary without a command now errors and shows help output (previously there was no output whatsoever).
- Improved help messages for various options.
- Added an app switch key. Thanks @koral--!

### Fixes

- Fixed Lenovo A806 and most likely other cheap Lenovo devices as well by updating [adbkit](https://github.com/openstf/adbkit).
- Fixed ZUK Z1, Z2 and others by adding an alternate install location for our binaries, since `/data/local/tmp` is mounted as noexec on those devices. Thanks @dkw72n!
- Updated [adbkit-apkreader](https://github.com/openstf/adbkit-apkreader) to resolve issues with certain APK files that were unparseable and therefore failed installation. We've only seen a single a single APK with this issue, but there could be more.
- Updated [adbkit-apkreader](https://github.com/openstf/adbkit-apkreader) to resolve another unrelated parsing issue with slightly malformed manifest files.
- Updated [adbkit](https://github.com/openstf/adbkit) to resolve an issue where trailing spaces in an adb public key would cause an error during adb connect.
- Updated [adbkit](https://github.com/openstf/adbkit) to resolve issues with log parsing on Android 7.0 and later, caused by Android no longer transforming `\n` to `\r\n`.
- Updated [adbkit](https://github.com/openstf/adbkit) to resolve an issue with recent versions of ADB that include a null byte in `adbkey.pub`, which was causing validation to fail.
- Fixed [minitouch](https://github.com/openstf/minitouch) on Blackberry PRIV.

### Misc

- We now use [please-update-dependencies](https://github.com/sorccu/please-update-dependencies) to check for outdated dependencies when running from source. It's a super quick local check that compares `package.json` with installed dependencies. Should help avoid unnecessary issues caused by forgetting to run `npm install` after `git pull`.

### Breaking changes

- Node v6.9.x or later is now required. Earlier versions will not work. To avoid a sudden flood of issues about this change, [please-update-dependencies](https://github.com/sorccu/please-update-dependencies) enforces the minimum version and tells you if you need to update.
- The `-C` shortcut for the `--no-cleanup` option has been removed due to the switch to [yargs](http://yargs.js.org). Please use the full `--no-cleanup` option instead.
- Although likely not used by anyone, it was possible to give multiple ZeroMQ endpoints to options such as `--connect-push` by separating them with commas. This is still possible but now works in a different way due to the switch to [yargs](http://yargs.js.org). Comma-separated hosts in a single value are no longer accepted. If you need to specify multiple hosts, simply use the option as many times as you like. This change is unlikely to have any impact whatsoever on most users.
- The `--devices` option of `stf doctor` has been removed due to unnecessary complexity.

## 2.3.0 (2016-11-09)

Minor release addressing the following:

### Fixes

- Fixed [minicap](https://github.com/openstf/minicap) on various devices running Android 4.2, incl. Qumo Quest 405, Yoga Tablet 8 etc. There may still be some that do not work, as 4.2 was customized pretty heavily by some makers. Thanks to @dkw72n for tracking down the issue and coming up with a fix! And as always, please let us know if you find any device (running any Android version) that does not work.

## 2.2.0 (2016-11-09)

Minor release addressing the following:

### Fixes

- Fixed [minicap](https://github.com/openstf/minicap) on some/all Samsung devices running Android 5.1.1, which did not work previously. Thanks to @dkw72n for tracking down the issue and coming up with a fix!

### Misc

- The [openstf/stf-armv7l](https://hub.docker.com/r/openstf/stf-armv7l/) Docker image is being built again. Our previous armv7l build server died and [Scaleway](https://www.scaleway.com/) did not have more available until recently.

## 2.1.0 (2016-10-24)

Minor release addressing the following:

### Enhancements

- Android 7.1 support!

### Fixes

- [STFService.apk](https://github.com/openstf/STFService.apk) now uses abstract sockets instead of TCP sockets. This fixes stability issues with devices connected in RNDIS mode.
- Updated [adbkit](https://github.com/openstf/adbkit) to fix `logcat` issues on newer Android versions.
- General reliability improvements in [adbkit](https://github.com/openstf/adbkit).
- Fixed [minitouch](https://github.com/openstf/minitouch) on Alcatel Idol 3.

## 2.0.1 (2016-07-29)

No changes, just a retag due to issues with NPM tags.

## 2.0.0 (2016-07-29)

Major release addressing the following:

### Enhancements

- Added a simple [REST API](doc/API.md). Huge thanks to @vbanthia!
    * Also, we have an example showing [how to use the API with Appium](https://github.com/openstf/stf-appium-example).

### Breaking changes

- The API server is a new app unit that must be added to your deployment. Please see the [deployment guide](doc/DEPLOYMENT.md) for up to date instructions.

## 1.2.0 (2016-07-22)

Minor release addressing the following:

### Enhancements

* Added Android N Developer Preview 5 support (earlier only available by building from master).
* Added an easier to access button to stop using a device from the control screen. Thanks [@miss0110](https://github.com/miss0110)!
* Updated the official Docker image to Ubuntu 16.04 and Node v6.3.0.
* Added a `--no-cleanup` option to disable the default behavior of apps getting cleaned up automatically when a user stops using the device.
* Added ESLint rules for easily checking pull requests.
* Added a Slack notifier unit.
* Added an `stf doctor` command to check and output external dependencies. Very useful for issues.
* Added an OpenID auth unit. Thanks [@codeskyblue](https://github.com/codeskyblue)!
* Added optional HTTP Basic auth to the mock auth unit, for when you can't set up a proper auth adapter but still want at least a tiny bit of added security.
* Considerably smaller and up to date official [Docker image for armv7l](https://hub.docker.com/r/openstf/stf-armv7l/) with automated nightly builds on [Scaleway](https://www.scaleway.com/). May occasionally break for a while but we aim to always keep it fully up to date.
* Added instructions for using [Google OAuth 2.0](https://developers.google.com/identity/protocols/OAuth2) login to the deployment guide, making it possible to sign in using your Google account.
* Added a configurable username field to the LDAP auth unit. Thanks [@bananayong](https://github.com/bananayong)!
* Updated and added various translations.

### Fixes

* Fixed screen area not being visible in latest versions of Chrome.
* Fixed Meizu Note 2 and similar devices which did not work due to non-standard output.
* Fixed ports getting leaked causing the provider unit to completely run out of ports if devices die a lot. Thanks [@skyline-gleb](https://github.com/skyline-gleb)!

## 1.1.1 (2016-01-13)

Patch release addressing the following:

### Fixes
- [Disabled Nagle Algorithm in adbkit connection](https://github.com/openstf/adbkit/issues/41) to improve remote debugging speed

## 1.1.0 (2016-01-04)

Minor release addressing the following:

### Enhancements
- Android 6.0 support
- Added translation support for Chinese, Korean, Russian and Spanish
- Added File Explorer feature in device controller where you can access device file system
- Added optional storage-s3 unit which can store storage data in Amazon S3 bucket instead of local
- Now, "Notes" column of device list is editable.
- Experimental armv7l support
- Added [stf-setup-examples](https://github.com/openstf/setup-examples) using [Vagrant](https://www.vagrantup.com/) and [Virtual Box](https://www.virtualbox.org/)

### Fixes
- [DEPLOYMENT doc ](https://github.com/openstf/stf/blob/master/doc/DEPLOYMENT.md) fixes
