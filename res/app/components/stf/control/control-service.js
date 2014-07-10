module.exports = function ControlServiceFactory(
  $upload
, $http
, socket
, TransactionService
, $rootScope
, gettext
) {
  var controlService = {
  }

  function ControlService(target, channel) {
    var keyCodes = {
      8: 'del' // backspace
    , 9: 'tab' // tab
    , 13: 'enter' // enter
    , 20: 'caps_lock' // caps lock
    , 27: 'escape' // esc
    , 33: 'page_up' // page up
    , 34: 'page_down' // page down
    , 35: 'move_end' // end
    , 36: 'move_home' // home
    , 37: 'dpad_left' // left arrow
    , 38: 'dpad_up' // up arrow
    , 39: 'dpad_right' // right arrow
    , 40: 'dpad_down' // down arrow
    , 45: 'insert' // insert
    , 46: 'forward_del' // delete
    , 93: 'menu' // windows menu key
    , 112: 'f1' // f1
    , 113: 'f2' // f2
    , 114: 'f3' // f3
    , 115: 'f4' // f4
    , 116: 'f5' // f5
    , 117: 'f6' // f6
    , 118: 'f7' // f7
    , 119: 'f8' // f8
    , 120: 'f9' // f9
    , 121: 'f10' // f10
    , 122: 'f11' // f11
    , 123: 'f12' // f12
    , 144: 'num_lock' // num lock
    }

    function sendOneWay(action, data) {
      socket.emit(action, channel, data)
    }

    function sendTwoWay(action, data) {
      var tx = TransactionService.create(target)
      socket.emit(action, channel, tx.channel, data)
      return tx.promise
    }

    function touchSender(type) {
      return function(seq, x, y) {
        sendOneWay(type, {
          seq: seq
        , x: x
        , y: y
        })
      }
    }

    function keySender(type, fixedKey) {
      return function(key) {
        if (typeof key === 'string') {
          sendOneWay(type, {
            key: key
          })
        }
        else {
          var mapped = fixedKey || keyCodes[key]
          if (mapped) {
            sendOneWay(type, {
              key: mapped
            })
          }
        }
      }
    }

    this.touchDown = touchSender('input.touchDown')
    this.touchMove = touchSender('input.touchMove')
    this.touchUp   = touchSender('input.touchUp')
    this.tap       = touchSender('input.tap')

    this.keyDown   = keySender('input.keyDown')
    this.keyUp     = keySender('input.keyUp')
    this.keyPress  = keySender('input.keyPress')

    this.home = keySender('input.keyPress', 'home')
    this.menu = keySender('input.keyPress', 'menu')
    this.back = keySender('input.keyPress', 'back')

    this.type = function(text) {
      return sendOneWay('input.type', {
        text: text
      })
    }

    this.paste = function(text) {
      return sendTwoWay('clipboard.paste', {
        text: text
      })
    }

    this.copy = function() {
      return sendTwoWay('clipboard.copy')
    }

    //@TODO: Refactor this please
    var that = this
    this.getClipboardContent = function () {
      that.copy().then(function (result) {
        $rootScope.$apply(function () {
          if (result.success) {
            if (result.lastData) {
              that.clipboardContent = result.lastData
            } else {
              that.clipboardContent = gettext('No clipboard data')
            }
          } else {
            that.clipboardContent = gettext('Error while getting data')
          }
        })
      })
    }

    this.shell = function(command) {
      return sendTwoWay('shell.command', {
        command: command
      , timeout: 10000
      })
    }

    this.identify = function() {
      return sendTwoWay('device.identify')
    }

    this.install = function(options) {
      return sendTwoWay('device.install', options)
    }

    this.uninstall = function(pkg) {
      return sendTwoWay('device.uninstall', {
        packageName: pkg
      })
    }

    this.reboot = function() {
      return sendTwoWay('device.reboot')
    }

    this.rotate = function(rotation) {
      return sendOneWay('display.rotate', {
        rotation: rotation
      })
    }

    this.testForward = function(forward) {
      return sendTwoWay('forward.test', {
        targetHost: forward.targetHost
      , targetPort: forward.targetPort
      })
    }

    this.createForward = function(forward) {
      return sendTwoWay('forward.create', {
        devicePort: forward.devicePort
      , targetHost: forward.targetHost
      , targetPort: forward.targetPort
      })
    }

    this.removeForward = function(forward) {
      return sendTwoWay('forward.remove', {
        devicePort: forward.devicePort
      })
    }

    this.startLogcat = function(filters) {
      return sendTwoWay('logcat.start', {
        filters: filters
      })
    }

    this.stopLogcat = function() {
      return sendTwoWay('logcat.stop')
    }

    this.startRemoteConnect = function() {
      return sendTwoWay('connect.start')
    }

    this.stopRemoteConnect = function() {
      return sendTwoWay('connect.stop')
    }

    this.openBrowser = function(url, browser) {
      return sendTwoWay('browser.open', {
        url: url
      , browser: browser ? browser.id : null
      })
    }

    this.clearBrowser = function(browser) {
      return sendTwoWay('browser.clear', {
        browser: browser.id
      })
    }

    this.openStore = function() {
      return sendTwoWay('store.open')
    }

    this.screenshot = function() {
      return sendTwoWay('screen.capture')
    }

    this.removeAccount = function() {
      return sendTwoWay('account.remove')
    }

    this.addAccountMenu = function() {
      return sendTwoWay('account.addmenu')
    }

    this.addAccount = function(user, password) {
      return sendTwoWay('account.add', {
        user: user
      , password: password
      })
    }

    this.setRingerMode = function(mode) {
      return sendTwoWay('ringer.set', {
        mode: mode
      })
    }

    this.setWifiEnabled = function(enabled) {
      return sendTwoWay('wifi.set', {
        enabled: enabled
      })
    }

    this.getWifiStatus = function() {
      return sendTwoWay('wifi.get')
    }

    window.cc = this
  }

  controlService.create = function(target, channel) {
    return new ControlService(target, channel)
  }

  return controlService
}
