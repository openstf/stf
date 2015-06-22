# STF

STF (or Smartphone Test Farm) is a web application for debugging smartphones, smartwatches and other gadgets remotely, from the comfort of your browser.

It is currently being used at [CyberAgent](https://www.cyberagent.co.jp/en/) to control a growing collection of more than 160 devices.

## Features

* OS support
  - Android
    * Supports versions 2.3.3 (SDK level 10) to 5.1 (SDK level 22), plus Android M Developer Preview
    * Supports Wear 5.1 (but not 5.0 due to missing permissions)
    * Supports Fire OS, CyanogenMod, and other heavily Android based distributions
* Remote control any device from your browser
  - Real-time screen view
    * Refresh speed can reach 30-40 FPS depending on specs and Android version. See [minicap](https://github.com/openstf/minicap) for more information.
    * Rotation support
  - Supports typing text from your own keyboard
    * Supports meta keys
    * Copy and paste support (although it can be a bit finicky on older devices, you may need to long-press and select paste manually)
    * May sometimes not work well with non-Latin languages unfortunately.
  - Multitouch support on touch screens, two finger pinch/rotate/zoom gesture support on regular screens by pressing `Alt` while dragging
  - Drag & drop installation and launching of `.apk` files
    * Launches main launcher activity if specified in the manifest
  - Reverse port forwarding
    * Access your local server directly from the device, even if it's not on the same network
  - Open websites easily in any browser
    * Installed browsers are detected in real time and shown as selectable options
    * Default browser is detected automatically if selected by the user
  - Execute shell commands and see real-time output
  - Display and filter device logs
  - Use `adb connect` to connect to a remote device as if it was plugged in to your computer, regardless of [ADB](http://developer.android.com/tools/help/adb.html) mode and whether you're connected to the same network
    * Run any `adb` command locally, including shell access
    * [Android Studio](http://developer.android.com/tools/studio/index.html) and other IDE support, debug your app while watching the device screen on your browser
    * Supports [Chrome remote debug tools](https://developer.chrome.com/devtools/docs/remote-debugging)
* Manage your device inventory
  - See which devices are connected, offline/unavailable (indicating a weak USB connection), unauthorized or unplugged
  - See who's using a device
  - Search devices by phone number, IMEI, ICCID, Android version, operator, product name and/or many other attributes with easy but powerful queries
  - Show a bright red screen with identifying information on a device you need to locate physically
  - Track battery level and health
  - Rudimentary Play Store account management
    * List, remove and add new accounts (adding may not work on all devices)
  - Display hardware specs

## Requirements

* [Node.js](https://nodejs.org/) >= 0.12
* [Bower](http://bower.io/)
* [RethinkDB](http://rethinkdb.com/) >= 2.0.0
* [GraphicsMagick](http://www.graphicsmagick.org/) (for resizing screenshots)
* [ZeroMQ](http://zeromq.org/) libraries installed

## Getting Started

See [GETTING_STARTED.md](GETTING_STARTED.md).

## Updating

See [UPDATING.md](UPDATING.md).

## Testing

See [TESTING.md](TESTING.md).

## Contributing

See [CONTRIBUTING.md](CONTRIBUTING.md).

## License

See [LICENSE](LICENSE).

Copyright © CyberAgent, Inc. All Rights Reserved.
