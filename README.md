# STF

STF (or Smartphone Test Farm) is a web application for debugging smartphones, smartwatches and other gadgets remotely, from the comfort of your browser.

It is currently being used at [CyberAgent](https://www.cyberagent.co.jp/en/) to control a growing collection of more than 160 devices.

![Close-up of device shelf](doc/shelf_closeup_790x.jpg?raw=true)

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

## A quick note about security

As the product has evolved from an internal tool running in our internal network, we have made certain assumptions about the trustworthiness of our users. As such, there is little to no security or encryption between the different processes. Furthermore, devices do not get completely reset between uses, potentially leaving accounts logged in or exposing other sensitive data. This is not an issue for us as all of our devices are test devices only used with test accounts, but it may be an issue for you if you plan on deploying STF to a multiuser environment. We welcome contributions in this area.

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

We also provide a [Docker](http://docker.com/) container in the [Docker Hub](https://hub.docker.com/) as [openstf/stf](https://registry.hub.docker.com/u/openstf/stf/). You can use our [Dockerfile](Dockerfile) as guidance if you'd prefer to do the installation yourself.

You should now be ready to [build](#building) or [run](#running) STF.

Note that while OS X can be used for development, it doesn't provide a very reliable experience in production due to (presumed) bugs in ADB's OS X implementation. We use [CoreOS](https://coreos.com/) but any Linux or BSD distribution should do fine.

## Installation

As mentioned earlier, you must have all of the [requirements](#requirements) installed first. Then you can simply install via NPM:

```bash
npm install -g stf
```

Now you're ready to [run](#running). For development, though, you should [build](#building) instead.

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

If you don't have RethinkDB set up yet, to start it up, go to the folder where you'd like RethinkDB to create a `rethinkdb_data` folder in (perhaps the folder where this repo is) and run the following command:

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

## FAQ

### Will I have to change battery packs all the time?

Nope, we've had many devices running since the initial prototype phase about two years ago, and we've only had a single incident so far. The battery expanded causing the casing to split from the seams. The device itself was working fine and reporting full battery health, but it was discarded due to safety reasons.

Devices should be allowed to turn their screens off when idle, which is what we are doing. All of our devices report perfect battery health so far.

Note, however, that you may have a problem if your USB hubs are unable to both provide enough power and support the data connection at the same time. This can cause a device to stop charging when being used, resulting in many charging cycles. If this happens you will just need to [get a better USB hub](#recommended-hardware).

### Is the system secure?

It's possible to run the whole user-facing side behind HTTPS, but that's pretty much it. All internal communication between processes is insecure and unencrypted, which is a problem if you can eavesdrop on the network. See our [quick note about security](#a-quick-note-about-security).

### Can I just put the system online, put a few devices there and start selling it?

Yes and no. See "[Is the system secure?](#is-the-system-secure)". The system has been built in an environment where we are able to trust our users and be confident that they're not going to want to mess with others. In the current incarnation of the system a malicious user with knowledge of the inner workings will, for instance, be able to control any device at any time, whether it is being used by someone or not. Pull requests are welcome.

### Once I've got the system running, can I pretty much leave it like that or is manual intervention required?

In our experience the system runs just fine most of the time, and any issues are mostly USB-related. You'll usually have to do something about once a week.

The most common issue is that a device will lose all of its active USB connections momentarily. You'll get errors in the logs but the worker process will either recover or get respawned, requiring no action on your side.

Below are the most common errors that do require manual intervention.

* One device worker keeps getting respawned all the time
  - Rebooting the device usually helps. If the device stays online for long enough you might be able to do it from the UI. Otherwise you'll have to SSH into the server and run `adb reboot` manually.
  - This could be a sign that you're having USB problems, and the device wishes to be moved elsewhere. The less complex your setup is the fewer problems you're going to experience. See [troubleshooting](#troubleshooting).
  - We're working on adding periodic automatic restarts and better graceful recovery to alleviate the issue.
* A whole group of devices keeps dying at once
  - They're most likely connected to the same USB hub. Either the hub is bad or you have other compatibility issues. In our experience this usually happens with USB 3.0 hubs, or you may have a problem with your USB extension card. See [recommended hardware](#recommended-hardware).
* A device that should be online is not showing up in the list or is showing up as disconnected
  - See [troubleshooting](#troubleshooting).

### How do I uninstall STF from my device?

When you unplug your device, all STF utilities except STFService stop running automatically. It doesn't do any harm to force stop or uninstall it.

To uninstall the STFService, run the following command:

```bash
adb uninstall jp.co.cyberagent.stf
```

You may also wish to remove our support binaries, although as mentioned before they won't run unless the device is actually connected to STF. You can do this as follows:

```bash
adb shell rm /data/local/tmp/minicap \
  /data/local/tmp/minicap.so \
  /data/local/tmp/minitouch \
  /data/local/tmp/minirev
```

Your device is now clean.

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
  - If you're using a USB hub, try a [powered hub](#recommended-hardware) instead (one that comes with a separate AC adapter).
  - Even if you're using a powered hub, there might not actually be enough power for all ports simultaneously. [Get a better hub](#recommended-hardware) or use fewer ports.
  - Your device is too power hungry, can happen with tablets. [Get a better hub](#recommended-hardware).
* Insufficient USB host controller resources
  - On Linux, use `dmesg` to check for this error
  - If you've only got 9-12 devices connected and an Intel (Haswell) processor, it's most likely an issue with the processor. If your BIOS has an option to disable USB 3.0, that might help. If not, you're screwed and must get a PCIE extension card with onboard controllers.
* Your powered USB hub does not support the device
  - Can happen with older devices and newer Battery Charging spec compatible hubs. [Get a more compatible hub](#recommended-hardware).
* The USB cable is bad
  - It happens. Try another one.
* The USB hub is broken
  - This, too, happens. Just try a new one.
* The device might not have a unique USB serial number, causing STF to overwrite the other device instead
  - This has never happened to us so far, but we do have one dirt-cheap Android 4.4 device whose serial number is the wonderfully unique "0123456789ABCDEF". Presumably if we had more than one unit we would have a problem.

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
* The USB hub broke
  - Happens. Just try a new one.

## Recommended hardware

This is a list of components we are currently using and are proven to work.

### PC components

These components are for the PC where the USB devices are connected. Our operating system of choice is [CoreOS](https://coreos.com/), but any other Linux or BSD distribution should do fine. Be sure to use reasonably recent kernels, though, as they often include improvements for the USB subsystem.

Our currently favorite build is as follows. It will be able to provide 28 devices using powered USB hubs, and about 10 more if you're willing to use the motherboard's USB ports, which is usually not recommended for stability reasons. Note that our component selection is somewhat limited by their availability in Japan.

| Component | Recommendation | How many |
|-----------|------|----------|
| PC case | [XIGMATEK Nebula](http://www.xigmatek.com/product.php?productid=219) | x1 |
| Motherboard | [ASUS H97I-PLUS](https://www.asus.com/Motherboards/H97IPLUS/) | x1 |
| Processor | [Intel® Core™ i5-4460](http://ark.intel.com/products/80817/Intel-Core-i5-4460-Processor-6M-Cache-up-to-3_40-GHz) | x1 |
| PSU | [Corsair CX Series™ Modular CX430M ATX Power Supply](http://www.corsair.com/en/cx-series-cx430m-modular-atx-power-supply-430-watt-80-plus-bronze-certified-modular-psu) | x1 |
| Memory | Your favorite DDR3 1600 MHz 8GB stick | x1 |
| SSD | [A-DATA Premier Pro SP900 64GB SSD](http://www.adata.com/en/ssd/specification/171) | x1 |
| USB extension card | [StarTech.com 4 Port PCI Express (PCIe) SuperSpeed USB 3.0 Card Adapter w/ 4 Dedicated 5Gbps Channels - UASP - SATA / LP4 Power](http://www.startech.com/Cards-Adapters/USB-3.0/Cards/PCI-Express-USB-3-Card-4-Dedicated-Channels-4-Port~PEXUSB3S44V) | x1 |
| USB hub | [Plugable USB 2.0 7 Port Hub with 60W Power Adapter](http://plugable.com/products/usb2-hub7bc) | x4 |
| MicroUSB cable | [Monoprice.com 1.5ft USB 2.0 A Male to Micro 5pin Male 28/24AWG Cable w/ Ferrite Core (Gold Plated)](http://www.monoprice.com/Product?c_id=103&cp_id=10303&cs_id=1030307&p_id=5456&seq=1&format=2) | x28 |

You may also need extension cords for power.

Alternatively, if you find that some of your older devices [do not support the recommended hub](#troubleshooting), you may wish to mix the hub selection as follows:

| Component | Recommendation | How many |
|-----------|------|----------|
| USB hub | [Plugable USB 2.0 7 Port Hub with 60W Power Adapter](http://plugable.com/products/usb2-hub7bc) | x2 |
| USB hub for older devices | [System TALKS USB2-HUB4XA-BK](http://www.system-talks.co.jp/product/sgc-4X.htm) | x2-4 |

You can connect up to two of the older hubs (providing up to 8 devices total) directly to the motherboard without exhausting USB host controller resources.

We also have several "budget builds" with an [MSI AM1I](http://www.msi.com/product/mb/AM1I.html#hero-overview) motherboard and an [AMD Athlon 5350 4-core processor](http://www.amd.com/en-gb/products/processors/desktop/athlon). These builds, while significantly cheaper, sometimes completely lose the USB PCIE extension cards, and even a reboot will not always fix it. This may normally be fixable via BIOS USB settings, but unfortunately the budget motherboard has a complete lack of any useful options. However, the AMD processor does not share Intel's Haswell [USB host control resource problem](#troubleshooting), so you can also just connect your hubs to the motherboard directly if you don't mind sharing the root bus.

Below is an incomplete list of some of the components we have tried so far, including unsuitable ones.

#### Tested equipment

_Note that our hardware score ratings only reflect their use for the purposes of this project, and are not an overall statement about the quality of the product._

##### USB extension cards

| Name | Score | Short explanation |
|------|-------|-------------------|
| [StarTech.com 4 Port PCI Express (PCIe) SuperSpeed USB 3.0 Card Adapter w/ 4 Dedicated 5Gbps Channels - UASP - SATA / LP4 Power](http://www.startech.com/Cards-Adapters/USB-3.0/Cards/PCI-Express-USB-3-Card-4-Dedicated-Channels-4-Port~PEXUSB3S44V) | 9/10 | Reliable, well supported chipset and good power connections |
| [StarTech.com 4 Independent Port PCI Express USB 2.0 Adapter Card](http://www.startech.com/Cards-Adapters/USB-2/Card/4-Independent-Port-PCI-Express-USB-Card~PEXUSB400) | 8/10 | Reliable |
| [玄人志向 USB3.0RX4-P4-PCIE](http://www.kuroutoshikou.com/product/interface/usb/usb3_0rx4-p4-pcie/) | 4/10 | Well supported chipset but breaks VERY easily |

Our current recommendation is [StarTech.com's PEXUSB3S44V](http://www.startech.com/Cards-Adapters/USB-3.0/Cards/PCI-Express-USB-3-Card-4-Dedicated-Channels-4-Port~PEXUSB3S44V). It provides an independent Renesas (allegedly Linux-friendliest) µPD720202 host controller for each port. Another option from the same maker is [PEXUSB400](http://www.startech.com/Cards-Adapters/USB-2/Card/4-Independent-Port-PCI-Express-USB-Card~PEXUSB400), which also works great but may offer slightly less future proofing.

Our [玄人志向 USB3.0RX4-P4-PCIE](http://www.kuroutoshikou.com/product/interface/usb/usb3_0rx4-p4-pcie/) cards have been nothing but trouble and we've mostly phased them out by now. Chipset-wise it's pretty much the same thing as StarTech's offering, but the SATA power connector is awfully flimsy and can actually physically break off. The card is also incredibly sensitive to static electricity and will permanently brick itself, which happened on numerous occasions.

##### USB hubs

| Name | Score | Short explanation |
|------|-------|-------------------|
| [Plugable USB 2.0 7 Port Hub with 60W Power Adapter](http://plugable.com/products/usb2-hub7bc) | 8/10 | High power output, high reliability |
| [Plugable USB 3.0 7-port Charging Hub with 60W Power Adapter](http://plugable.com/products/usb3-hub7bc) | 5/10 | High power output, low reliability |
| [System TALKS USB2-HUB4XA-BK USB 2.0 hub with power adapter](http://www.system-talks.co.jp/product/sgc-4X.htm) | 7/10 | High power output on two ports which complicates device positioning, low port count |
| [Anker USB 3.0 9-Port Hub + 5V 2.1A Charging Port](http://www.ianker.com/product/68ANHUB-B10A) | 2/10 | High port count, insufficient power |
| [ORICO P10-U2 External ABS 10 Port 2.0 USB HUB for Laptop/Desktop-BLACK](http://www.aliexpress.com/store/product/Orico-p10-u2-computer-usb-hub-usb-splitter-10-usb-hub-interface/105327_1571541943.html) | 3/10 | High port count, insufficient power |
| [ORICO BH4-U3-BK ABS 4 Port USB3.0 BC1.2 Charging HUB with 12V3A Power Adapter-BLACK](http://www.aliexpress.com/store/product/ORICO-BH4-U3-BK-ABS-4-Port-USB3-0-BC1-2-Charging-HUB-with-12V3A-Power/105327_2035899542.html) | 5/10 | High power output, low reliability |

The best hub we've found so far is Plugable's [USB 2.0 7 Port Hub with 60W Power Adapter](http://plugable.com/products/usb2-hub7bc). It's able to provide 1.5A per port for Battery Charging spec compliant devices, which is enough to both charge and sync even tablets (although charging will not occur at maximum speed, but that's irrelevant to us). Note that even devices that are not compliant will usually charge and sync just fine, albeit slower. The more recent USB 3.0 version has proven unreliable with the rest of our components, causing the whole hub to disconnect at times. Annoyingly the ports face the opposite direction, too. Note that ORICO also provides hubs that are identical to Plugable's offerings, the latter of which seem to be rebrands.

Unfortunately Plugable's USB 2.0 hub is not perfect either, at least for our purposes. It includes a physical on/off switch which can be especially annoying if your devices are in a regular office with occasional scheduled power outages. This will shut down the PC too, of course, but the problem is that once power comes back online, the hubs will be unable to switch themselves on and the devices won't charge, leading you to find a bunch of dead devices the next Monday.

The System TALKS USB 2.0 hub is very reliable, but has a few annoying drawbacks. First, the power adapter only provides power to two of its four ports, while the other two are powered by the host PC. The problem with this approach is that you must figure out which devices are power hungry yourself and put them on the ports with higher current. This can complicate device setup/positioning quite a bit. Another drawback is that if the host PC is turned off, only the powered ports will keep charging the connected devices. However, the hub is amazingly compatible with pretty much anything, making it the top choice for older devices that do not support the Battery Charging hubs.

Most powered USB 3.0 hubs we've tested have had a serious problem: the whole hub occasionally disconnected. This may have been caused by the specific combination of our components and/or OS, but as of yet we don't really know. Disabling USB 3.0 may help if you run into the same problem.

## Testing

See [TESTING.md](TESTING.md).

## Contributing

See [CONTRIBUTING.md](CONTRIBUTING.md).

## License

See [LICENSE](LICENSE).

Copyright © CyberAgent, Inc. All Rights Reserved.
