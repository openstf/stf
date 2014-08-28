# Remote Debugging

## Before starting

To be able to use the device locally you need to have installed the [Android SDK Tools](https://developer.android.com/sdk/index.html).


## Debugging

To be able to debug the remote device on a local machine, you need to do the following:

1. On STF, after controlling a device, go to the **Dashboard** tab -> **Remote Debug** panel.

2. There will be a text field with content like `adb connect ...`. Click and copy that text.

3. Paste it and run it your command line.

This will connect the device locally.

You can check it worked, by going to your command line and typing:
```bash
adb devices
```


### Android Studio

You should be able to debug the device, however the IDE still has some bugs when using the debugger.


### Eclipse

You should be able to debug the device as-is.



### Chrome

#### On the device

On Chrome 32 and newer, you don't need to do anything on the device.

On Chrome 32 and earlier, you need to enable USB remote debugging inside *Chrome Settings*:

1. Open **Chrome**.
2. Go to **Settings** -> **Developer Tools**.
3. Enable **USB debugging**.

#### On your desktop browser

1. Open a new tab
2. Go to `chrome://inspect/#devices` on the address bar.
3. Enable **Discover USB devices** by clicking the checkbox.

It should show a list of pages opened inside the Device's Chrome browser and WebViews.

Now you can debug any page by clicking on **inspect**.

See more on the [Remote Debugging on Android with Chrome](https://developer.chrome.com/devtools/docs/remote-debugging) docs.


### Firefox

#### On the device

1. Open **Firefox**.
2. Go to **Settings** -> **Developer tools**.
3. Enable **Remote debugging**.

#### On your command line

Go to your command line, and type:

```
adb forward tcp:6000 tcp:6000
```

If you are using Firefox OS, type:

```
adb forward tcp:6000 localfilesystem:/data/local/debugger-socket
```


#### On your desktop browser

1. On the **Web Developer** menu, select **Connect**.
2. This will go to `chrome://browser/content/devtools/connect.xhtml`.
3. Press the **Connect** button.
4. On the device it will ask you to accept an **Incoming Connection**, press **OK**.

This should show a list of pages opened inside the Device's Firefox browser and WebViews.

See more on the [Remotely Debugging Firefox for Android](https://developer.mozilla.org/docs/Tools/Remote_Debugging/Firefox_for_Android) docs.
