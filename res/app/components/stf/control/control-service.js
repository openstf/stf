module.exports = function ControlServiceFactory(
  $rootScope
, $upload
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

    function touchSender(type) {
      return function(seq, x, y) {
        socket.emit(type, channel, {
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
          socket.emit(type, channel, {
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
      socket.emit('input.type', channel, {
        text: text
      })
    }

    this.paste = function(text) {
      var tx = TransactionService.create(target)
      socket.emit('clipboard.paste', channel, tx.channel, {
        text: text
      })
      return tx
    }

    this.copy = function() {
      var tx = TransactionService.create(target)
      socket.emit('clipboard.copy', channel, tx.channel)
      return tx
    }

    this.shell = function(command) {
      var tx = TransactionService.create(target)
      socket.emit('shell.command', channel, tx.channel, {
        command: command
      , timeout: 10000
      })
      return tx
    }

    this.identify = function() {
      var tx = TransactionService.create(target)
      socket.emit('device.identify', channel, tx.channel)
      return tx
    }

    this.uploadUrl = function(url) {
      var tx = TransactionService.create({
        id: 'storage'
      })
      socket.emit('storage.upload', channel, tx.channel, {
        url: url
      })
      return tx
    }

    this.uploadFile = function(files) {
      // Let's fake it till we can make it
      var result = new TransactionService.TransactionResult({
        id: 'storage'
      })
      return {
        promise:
          $upload.upload({
            url: '/api/v1/resources'
          , method: 'POST'
          , file: files[0]
          })
          .then(
            function(response) {
              result.settled = true
              result.progress = 100
              result.success = true
              result.lastData = 'success'
              result.data.push(result.lastData)
              result.body = response.data
              return result
            }
          , function(err) {
              result.settled = true
              result.progress = 100
              result.success = false
              result.error = result.lastData = 'fail'
              result.data.push(result.lastData)
              return result
            }
          )
      }
    }

    this.install = function(options) {
      var app = options.manifest.application
      var tx = TransactionService.create(target)
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
      socket.emit('device.install', channel, tx.channel, params)
      tx.manifest = options.manifest
      return tx
    }

    this.uninstall = function(pkg) {
      var tx = TransactionService.create(target)
      socket.emit('device.uninstall', channel, tx.channel, {
        packageName: pkg
      })
      return tx
    }

    this.rotate = function(rotation) {
      socket.emit('display.rotate', channel, {
        rotation: rotation
      })
    }
  }

  controlService.create = function(target, channel) {
    return new ControlService(target, channel)
  }

  return controlService
}
