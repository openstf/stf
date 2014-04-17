module.exports = function ControlServiceFactory(
  $upload
, $http
, socket
, TransactionService
) {
  var controlService = {
  }

  function ControlService(target, channel) {
    var keyCodes = {
      8: 8 // backspace
    , 13: 13 // enter
    , 20: 20 // caps lock
    , 27: 27 // esc
    , 33: 33 // page up
    , 34: 34 // page down
    , 35: 35 // end
    , 36: 36 // home
    , 37: 37 // left arrow
    , 38: 38 // up arrow
    , 39: 39 // right arrow
    , 40: 40 // down arrow
    , 45: 45 // insert
    , 46: 46 // delete
    , 93: 93 // windows menu key
    , 112: 112 // f1
    , 113: 113 // f2
    , 114: 114 // f3
    , 115: 115 // f4
    , 116: 116 // f5
    , 117: 117 // f6
    , 118: 118 // f7
    , 119: 119 // f8
    , 120: 120 // f9
    , 121: 121 // f10
    , 122: 122 // f11
    , 123: 123 // f12
    , 144: 144 // num lock
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
        var mapped = fixedKey || keyCodes[key]
        if (mapped) {
          sendOneWay(type, {
            key: mapped
          })
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

    this.home = keySender('input.keyPress', 3)
    this.menu = keySender('input.keyPress', 93)
    this.back = keySender('input.keyPress', 4)

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

    this.shell = function(command) {
      return sendTwoWay('shell.command', {
        command: command
      , timeout: 10000
      })
    }

    this.identify = function() {
      return sendTwoWay('device.identify')
    }

    this.uploadUrl = function(url) {
      var tx = TransactionService.create({
        id: 'storage'
      })
      socket.emit('storage.upload', channel, tx.channel, {
        url: url
      })
      return tx.promise
    }

    this.uploadFile = function(files) {
      if (files.length !== 1) {
        throw new Error('Can only upload one file')
      }
      var tx = TransactionService.create({
        id: 'storage'
      })
      TransactionService.punch(tx.channel)
        .then(function() {
          $upload.upload({
            url: '/api/v1/resources?channel=' + tx.channel
          , method: 'POST'
          , file: files[0]
          })
        })
      return tx.promise
    }

    this.install = function(options) {
      var app = options.manifest.application
      var params = {
        url: options.url
      }
      if (app.launcherActivities.length) {
        var activity = app.launcherActivities[0]
        params.launchActivity = {
          action: 'android.intent.action.MAIN'
        , component: options.manifest.package + '/' + activity.name
        , category: ['android.intent.category.LAUNCHER']
        , flags: 0x10200000
        }
      }
      return sendTwoWay('device.install', params)
    }

    this.uninstall = function(pkg) {
      return sendTwoWay('device.uninstall', {
        packageName: pkg
      })
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
  }

  controlService.create = function(target, channel) {
    return new ControlService(target, channel)
  }

  return controlService
}
