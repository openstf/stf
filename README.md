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
  - Multitouch support on touch screens via [minitouch](https://github.com/openstf/minitouch), two finger pinch/rotate/zoom gesture support on regular screens by pressing `Alt` while dragging
  - Drag & drop installation and launching of `.apk` files
    * Launches main launcher activity if specified in the manifest
  - Reverse port forwarding via [minirev](https://github.com/openstf/minirev)
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
* [Bower](http://bower.io/) (`npm install -g bower`)
* [ADB](http://developer.android.com/tools/help/adb.html) properly set up
* [RethinkDB](http://rethinkdb.com/) >= 2.0.0
* [GraphicsMagick](http://www.graphicsmagick.org/) (for resizing screenshots)
* [ZeroMQ](http://zeromq.org/) libraries installed
* [Protocol Buffers](https://github.com/google/protobuf) libraries installed

Note that you need these dependencies even if you've installed STF directly from [NPM](https://www.npmjs.com/), because they can't be included.

On OS X, you can use [homebrew](http://brew.sh/) to install most of the dependencies:

```bash
brew install rethinkdb graphicsmagick zeromq protobuf
```

You should now be ready to [build](#building) or [run](#running) STF.

Note that while OS X can be used for development, it doesn't provide a very reliable experience in production due to (presumed) bugs in ADB's OS X implementation. We use [CoreOS](https://coreos.com/) but any Linux or BSD distribution should do fine.

## Installation

As mentioned earlier, you must have all of the [requirements](#requirements) installed first. Then you can simply install via NPM:

```bash
npm install -g stf
```

For development, though, you should [build](#building) instead.

## Building

After you've got all the [requirements](#requirements) installed, it's time to fetch the rest of the dependencies.

First, fetch all NPM modules:

```bash
npm install
```

Then, fetch all Bower modules:

```bash
bower install
```

You may also wish to link the module so that you'll be able to access the `stf` command directly from the command line:

```bash
npm link
```

You should now have a working installation for local development.

## Running

STF comprises of several independent processes that must normally be launched separately. In our own setup each one these processes is its own [systemd](http://www.freedesktop.org/wiki/Software/systemd/) unit.

For development purposes, however, there's a helper command to quickly launch all required processes along with a mock login implementation. Note however that you **must** have RethinkDB running first.

If you don't have RethinkDB set up yet, to start it up, go to the folder where you'd like RethinkDB to create a `rethinkdb_data` folder (perhaps the folder where this repo is) and run the following command:

```bash
rethinkdb
```

You should now have RethinkDB running locally. Running the command again in the same folder will reuse the data from the previous session.

You're now ready to start up STF itself:

```bash
stf local
```

After the [webpack](http://webpack.github.io/) build process has finished (which can take a small while) you should have your private STF running on [http://localhost:7100](http://localhost:7100). If you had devices connected before running the command, those devices should now be available for use. If not, you should see what went wrong from your console. Feel free to plug in or unplug any devices at any time.

Note that if you see your device ready to use but without a name or a proper image, we're probably missing the data for that model in [our device database](https://github.com/openstf/stf-device-db). Everything should work fine either way.

## Updating

To update your development version, simply pull the repo and run `npm install` and `bower install` again. You may occasionally have to remove the whole `node_modules` folder to prevent NPM from complaining about version mismatches.

## Troubleshooting

### I plugged in a new device but it's not showing up in the list.

There can be various reasons for this behavior. Some especially common reasons are:

* USB debugging is not enabled
  - Enable it.
* USB debugging is enabled but the USB connection mode is wrong
  - Try switching between MTP and PTP modes and see if the device appears. This happens fairly often on OS X but almost never on Linux.
* You don't have the ADB daemon running
  - Make sure ADB is running with `adb start-server`.
* You haven't authorized the ADB key yet
  - Check your device for an authentication dialog. You may need to unplug and then plug the device back in to see the dialog.
* ADB hasn't whitelisted the manufacturer's vendor ID
  - [Add it yourself](https://github.com/apkudo/adbusbini) or wait for the new version that removes the stupid whitelisting feature to be deployed.
* Insufficient power supply
  - If you're using a USB hub, try a powered hub instead (one that comes with a separate AC adapter).
  - Even if you're using a powered hub, there might not actually be enough power for all ports simultaneously. Get a better hub or use fewer ports.
  - Your device is too power hungry, can happen with tablets. Get a better hub.
* Insufficient USB host controller resources
  - On Linux, use `dmesg` to check for this error
  - If you've only got 9-12 devices connected and an Intel (Haswell) processor, it's most likely an issue with the processor. If your BIOS has an option to disable USB 3.0, that might help. If not, you're screwed and must get a PCIE extension card with onboard controllers.
* Your powered USB hub does not support the device
  - Can happen with older devices and newer Battery Charging spec compatible hubs.
* The USB cable is bad
  - It happens. Try another one.

### A device that was previously connected no longer shows up in the list.

Again, there can be various reasons for this behavior as well. Some common reasons are:

* The device ran out of power
  - You can see the last reported power level in the device list, unless there was a lengthy power outage preventing the battery level from being reported.
* Someone accidentally disabled USB debugging remotely
  - Yes, it happens.
* An OS update disabled USB debugging
  - Yes, it happens. Especially on Fire OS.
* Someone touched the USB cable just the wrong way causing a disconnection
  - Happens easily.
* Your PCIE USB extension card died
  - Yes, it happens.
* Temporary network issues
  - Can't help with that.
* Someone removed the device physically.
  - Or that.
* You're on OS X
  - There's a bug in ADB's OS X implementation that causes devices to be lost on error conditions. The problem is more pronounced when using USB hubs. You have to unplug and then plug it back in again.

## Testing

See [TESTING.md](TESTING.md).

## Contributing

See [CONTRIBUTING.md](CONTRIBUTING.md).

## License

See [LICENSE](LICENSE).

Copyright © CyberAgent, Inc. All Rights Reserved.
