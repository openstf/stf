# Changelog

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
