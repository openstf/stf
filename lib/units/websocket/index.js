var http = require('http')
var events = require('events')
var util = require('util')

var socketio = require('socket.io')
var Promise = require('bluebird')
var _ = require('lodash')
var request = Promise.promisifyAll(require('request'))
var adbkit = require('adbkit')
var uuid = require('node-uuid')

var logger = require('../../util/logger')
var wire = require('../../wire')
var wireutil = require('../../wire/util')
var wirerouter = require('../../wire/router')
var dbapi = require('../../db/api')
var datautil = require('../../util/datautil')
var srv = require('../../util/srv')
var lifecycle = require('../../util/lifecycle')
var zmqutil = require('../../util/zmqutil')
var cookieSession = require('./middleware/cookie-session')
var ip = require('./middleware/remote-ip')
var auth = require('./middleware/auth')
var jwtutil = require('../../util/jwtutil')

module.exports = function(options) {
  var log = logger.createLogger('websocket')
  var server = http.createServer()
  var io = socketio.listen(server, {
        serveClient: false
      , transports: ['websocket']
      })
  var channelRouter = new events.EventEmitter()

  // Output
  var push = zmqutil.socket('push')
  Promise.map(options.endpoints.push, function(endpoint) {
    return srv.resolve(endpoint).then(function(records) {
      return srv.attempt(records, function(record) {
        log.info('Sending output to "%s"', record.url)
        push.connect(record.url)
        return Promise.resolve(true)
      })
    })
  })
  .catch(function(err) {
    log.fatal('Unable to connect to push endpoint', err)
    lifecycle.fatal()
  })

  // Input
  var sub = zmqutil.socket('sub')
  Promise.map(options.endpoints.sub, function(endpoint) {
    return srv.resolve(endpoint).then(function(records) {
      return srv.attempt(records, function(record) {
        log.info('Receiving input from "%s"', record.url)
        sub.connect(record.url)
        return Promise.resolve(true)
      })
    })
  })
  .catch(function(err) {
    log.fatal('Unable to connect to sub endpoint', err)
    lifecycle.fatal()
  })

  // Establish always-on channels
  ;[wireutil.global].forEach(function(channel) {
    log.info('Subscribing to permanent channel "%s"', channel)
    sub.subscribe(channel)
  })

  sub.on('message', function(channel, data) {
    channelRouter.emit(channel.toString(), channel, data)
  })

  io.use(cookieSession({
    name: options.ssid
  , keys: [options.secret]
  }))

  io.use(ip({
    trust: function() {
      return true
    }
  }))

  io.use(auth)

  io.on('connection', function(socket) {
    var req = socket.request
    var user = req.user
    var channels = []

    user.ip = socket.handshake.query.uip || req.ip
    socket.emit('socket.ip', user.ip)

    function joinChannel(channel) {
      channels.push(channel)
      channelRouter.on(channel, messageListener)
      sub.subscribe(channel)
    }

    function leaveChannel(channel) {
      _.pull(channels, channel)
      channelRouter.removeListener(channel, messageListener)
      sub.unsubscribe(channel)
    }

    function createKeyHandler(Klass) {
      return function(channel, data) {
        push.send([
          channel
        , wireutil.envelope(new Klass(
            data.key
          ))
        ])
      }
    }

    var messageListener = wirerouter()
      .on(wire.DeviceLogMessage, function(channel, message) {
        socket.emit('device.log', message)
      })
      .on(wire.DeviceIntroductionMessage, function(channel, message) {
        socket.emit('device.add', {
          important: true
        , data: {
            serial: message.serial
          , present: false
          , provider: message.provider
          , owner: null
          , status: message.status
          , ready: false
          , reverseForwards: []
          }
        })
      })
      .on(wire.DeviceReadyMessage, function(channel, message) {
        socket.emit('device.change', {
          important: true
        , data: {
            serial: message.serial
          , channel: message.channel
          , owner: null // @todo Get rid of need to reset this here.
          , ready: true
          , reverseForwards: [] // @todo Get rid of need to reset this here.
          }
        })
      })
      .on(wire.DevicePresentMessage, function(channel, message) {
        socket.emit('device.change', {
          important: true
        , data: {
            serial: message.serial
          , present: true
          }
        })
      })
      .on(wire.DeviceAbsentMessage, function(channel, message) {
        socket.emit('device.remove', {
          important: true
        , data: {
            serial: message.serial
          , present: false
          , likelyLeaveReason: 'device_absent'
          }
        })
      })
      .on(wire.JoinGroupMessage, function(channel, message) {
        socket.emit('device.change', {
          important: true
        , data: datautil.applyOwner({
              serial: message.serial
            , owner: message.owner
            , likelyLeaveReason: 'owner_change'
            }
          , user
          )
        })
      })
      .on(wire.JoinGroupByAdbFingerprintMessage, function(channel, message) {
        socket.emit('user.keys.adb.confirm', {
          title: message.comment
        , fingerprint: message.fingerprint
        })
      })
      .on(wire.LeaveGroupMessage, function(channel, message) {
        socket.emit('device.change', {
          important: true
        , data: datautil.applyOwner({
              serial: message.serial
            , owner: null
            , likelyLeaveReason: message.reason
            }
          , user
          )
        })
      })
      .on(wire.DeviceStatusMessage, function(channel, message) {
        message.likelyLeaveReason = 'status_change'
        socket.emit('device.change', {
          important: true
        , data: message
        })
      })
      .on(wire.DeviceIdentityMessage, function(channel, message) {
        datautil.applyData(message)
        socket.emit('device.change', {
          important: true
        , data: message
        })
      })
      .on(wire.TransactionProgressMessage, function(channel, message) {
        socket.emit('tx.progress', channel.toString(), message)
      })
      .on(wire.TransactionDoneMessage, function(channel, message) {
        socket.emit('tx.done', channel.toString(), message)
      })
      .on(wire.DeviceLogcatEntryMessage, function(channel, message) {
        socket.emit('logcat.entry', message)
      })
      .on(wire.AirplaneModeEvent, function(channel, message) {
        socket.emit('device.change', {
          important: true
        , data: {
            serial: message.serial
          , airplaneMode: message.enabled
          }
        })
      })
      .on(wire.BatteryEvent, function(channel, message) {
        var serial = message.serial
        delete message.serial
        socket.emit('device.change', {
          important: false
        , data: {
            serial: serial
          , battery: message
          }
        })
      })
      .on(wire.DeviceBrowserMessage, function(channel, message) {
        var serial = message.serial
        delete message.serial
        socket.emit('device.change', {
          important: true
        , data: datautil.applyBrowsers({
            serial: serial
          , browser: message
          })
        })
      })
      .on(wire.ConnectivityEvent, function(channel, message) {
        var serial = message.serial
        delete message.serial
        socket.emit('device.change', {
          important: false
        , data: {
            serial: serial
          , network: message
          }
        })
      })
      .on(wire.PhoneStateEvent, function(channel, message) {
        var serial = message.serial
        delete message.serial
        socket.emit('device.change', {
          important: false
        , data: {
            serial: serial
          , network: message
          }
        })
      })
      .on(wire.RotationEvent, function(channel, message) {
        socket.emit('device.change', {
          important: false
        , data: {
            serial: message.serial
          , display: {
              rotation: message.rotation
            }
          }
        })
      })
      .on(wire.ReverseForwardsEvent, function(channel, message) {
        socket.emit('device.change', {
          important: false
        , data: {
            serial: message.serial
          , reverseForwards: message.forwards
          }
        })
      })
      .handler()

    // Global messages
    //
    // @todo Use socket.io to push global events to all clients instead
    // of listening on every connection, otherwise we're very likely to
    // hit EventEmitter's leak complaints (plus it's more work)
    channelRouter.on(wireutil.global, messageListener)

    // User's private group
    joinChannel(user.group)

    new Promise(function(resolve) {
      socket.on('disconnect', resolve)
        // Global messages for all clients using socket.io
        //
        // Device note
        .on('device.note', function(data) {
          return dbapi.setDeviceNote(data.serial, data.note)
            .then(function() {
              return dbapi.loadDevice(data.serial)
            })
            .then(function(device) {
              if (device) {
                io.emit('device.change', {
                  important: true
                , data: {
                    serial: device.serial
                  , notes: device.notes
                  }
                })
              }
            })
        })
        // Client specific messages
        //
        // Settings
        .on('user.settings.update', function(data) {
          dbapi.updateUserSettings(user.email, data)
        })
        .on('user.settings.reset', function() {
          dbapi.resetUserSettings(user.email)
        })
        .on('user.keys.accessToken.generate', function(data) {
          var jwt = jwtutil.encode({
            payload: {
              email: user.email
            , name: user.name
            }
          , secret: options.secret
          })

          var tokenId = util.format('%s-%s', uuid.v4(), uuid.v4()).replace(/-/g, '')
          var title = data.title

          return dbapi.saveUserAccessToken(user.email, {
            title: title
          , id: tokenId
          , jwt: jwt
          })
            .then(function() {
              socket.emit('user.keys.accessToken.generated', {
                title: title
              , tokenId: tokenId
              })
            })
        })
        .on('user.keys.accessToken.remove', function(data) {
          return dbapi.removeUserAccessToken(user.email, data.title)
            .then(function() {
              socket.emit('user.keys.accessToken.removed', data.title)
            })
        })
        .on('user.keys.adb.add', function(data) {
          return adbkit.util.parsePublicKey(data.key)
            .then(function(key) {
              return dbapi.lookupUsersByAdbKey(key.fingerprint)
                .then(function(cursor) {
                  return cursor.toArray()
                })
                .then(function(users) {
                  if (users.length) {
                    throw new dbapi.DuplicateSecondaryIndexError()
                  }
                  else {
                    return dbapi.insertUserAdbKey(user.email, {
                      title: data.title
                    , fingerprint: key.fingerprint
                    })
                  }
                })
                .then(function() {
                  socket.emit('user.keys.adb.added', {
                    title: data.title
                  , fingerprint: key.fingerprint
                  })
                })
            })
            .then(function() {
              push.send([
                wireutil.global
              , wireutil.envelope(new wire.AdbKeysUpdatedMessage())
              ])
            })
            .catch(dbapi.DuplicateSecondaryIndexError, function() {
              // No-op
            })
        })
        .on('user.keys.adb.accept', function(data) {
          return dbapi.lookupUsersByAdbKey(data.fingerprint)
            .then(function(cursor) {
              return cursor.toArray()
            })
            .then(function(users) {
              if (users.length) {
                throw new dbapi.DuplicateSecondaryIndexError()
              }
              else {
                return dbapi.insertUserAdbKey(user.email, {
                  title: data.title
                , fingerprint: data.fingerprint
                })
              }
            })
            .then(function() {
              socket.emit('user.keys.adb.added', {
                title: data.title
              , fingerprint: data.fingerprint
              })
            })
            .then(function() {
              push.send([
                user.group
              , wireutil.envelope(new wire.AdbKeysUpdatedMessage())
              ])
            })
            .catch(dbapi.DuplicateSecondaryIndexError, function() {
              // No-op
            })
        })
        .on('user.keys.adb.remove', function(data) {
          return dbapi.deleteUserAdbKey(user.email, data.fingerprint)
            .then(function() {
              socket.emit('user.keys.adb.removed', data)
            })
        })
        // Touch events
        .on('input.touchDown', function(channel, data) {
          push.send([
            channel
          , wireutil.envelope(new wire.TouchDownMessage(
              data.seq
            , data.contact
            , data.x
            , data.y
            , data.pressure
            ))
          ])
        })
        .on('input.touchMove', function(channel, data) {
          push.send([
            channel
          , wireutil.envelope(new wire.TouchMoveMessage(
              data.seq
            , data.contact
            , data.x
            , data.y
            , data.pressure
            ))
          ])
        })
        .on('input.touchUp', function(channel, data) {
          push.send([
            channel
          , wireutil.envelope(new wire.TouchUpMessage(
              data.seq
            , data.contact
            ))
          ])
        })
        .on('input.touchCommit', function(channel, data) {
          push.send([
            channel
          , wireutil.envelope(new wire.TouchCommitMessage(
              data.seq
            ))
          ])
        })
        .on('input.touchReset', function(channel, data) {
          push.send([
            channel
          , wireutil.envelope(new wire.TouchResetMessage(
              data.seq
            ))
          ])
        })
        .on('input.gestureStart', function(channel, data) {
          push.send([
            channel
          , wireutil.envelope(new wire.GestureStartMessage(
              data.seq
            ))
          ])
        })
        .on('input.gestureStop', function(channel, data) {
          push.send([
            channel
          , wireutil.envelope(new wire.GestureStopMessage(
              data.seq
            ))
          ])
        })
        // Key events
        .on('input.keyDown', createKeyHandler(wire.KeyDownMessage))
        .on('input.keyUp', createKeyHandler(wire.KeyUpMessage))
        .on('input.keyPress', createKeyHandler(wire.KeyPressMessage))
        .on('input.type', function(channel, data) {
          push.send([
            channel
          , wireutil.envelope(new wire.TypeMessage(
              data.text
            ))
          ])
        })
        .on('display.rotate', function(channel, data) {
          push.send([
            channel
          , wireutil.envelope(new wire.RotateMessage(
              data.rotation
            ))
          ])
        })
        // Transactions
        .on('clipboard.paste', function(channel, responseChannel, data) {
          joinChannel(responseChannel)
          push.send([
            channel
          , wireutil.transaction(
              responseChannel
            , new wire.PasteMessage(data.text)
            )
          ])
        })
        .on('clipboard.copy', function(channel, responseChannel) {
          joinChannel(responseChannel)
          push.send([
            channel
          , wireutil.transaction(
              responseChannel
            , new wire.CopyMessage()
            )
          ])
        })
        .on('device.identify', function(channel, responseChannel) {
          push.send([
            channel
          , wireutil.transaction(
              responseChannel
            , new wire.PhysicalIdentifyMessage()
            )
          ])
        })
        .on('device.reboot', function(channel, responseChannel) {
          joinChannel(responseChannel)
          push.send([
            channel
          , wireutil.transaction(
              responseChannel
            , new wire.RebootMessage()
            )
          ])
        })
        .on('account.check', function(channel, responseChannel, data) {
          joinChannel(responseChannel)
          push.send([
            channel
          , wireutil.transaction(
              responseChannel
            , new wire.AccountCheckMessage(data)
            )
          ])
        })
        .on('account.remove', function(channel, responseChannel, data) {
          joinChannel(responseChannel)
          push.send([
            channel
          , wireutil.transaction(
              responseChannel
            , new wire.AccountRemoveMessage(data)
            )
          ])
        })
        .on('account.addmenu', function(channel, responseChannel) {
          joinChannel(responseChannel)
          push.send([
            channel
          , wireutil.transaction(
              responseChannel
            , new wire.AccountAddMenuMessage()
            )
          ])
        })
        .on('account.add', function(channel, responseChannel, data) {
          joinChannel(responseChannel)
          push.send([
            channel
          , wireutil.transaction(
              responseChannel
            , new wire.AccountAddMessage(data.user, data.password)
            )
          ])
        })
        .on('account.get', function(channel, responseChannel, data) {
          joinChannel(responseChannel)
          push.send([
            channel
          , wireutil.transaction(
              responseChannel
            , new wire.AccountGetMessage(data)
            )
          ])
        })
        .on('sd.status', function(channel, responseChannel) {
          joinChannel(responseChannel)
          push.send([
            channel
          , wireutil.transaction(
              responseChannel
            , new wire.SdStatusMessage()
            )
          ])
        })
        .on('ringer.set', function(channel, responseChannel, data) {
          joinChannel(responseChannel)
          push.send([
            channel
          , wireutil.transaction(
              responseChannel
            , new wire.RingerSetMessage(data.mode)
            )
          ])
        })
        .on('ringer.get', function(channel, responseChannel) {
          joinChannel(responseChannel)
          push.send([
            channel
          , wireutil.transaction(
              responseChannel
            , new wire.RingerGetMessage()
            )
          ])
        })
        .on('wifi.set', function(channel, responseChannel, data) {
          joinChannel(responseChannel)
          push.send([
            channel
          , wireutil.transaction(
              responseChannel
            , new wire.WifiSetEnabledMessage(data.enabled)
            )
          ])
        })
        .on('wifi.get', function(channel, responseChannel) {
          joinChannel(responseChannel)
          push.send([
            channel
          , wireutil.transaction(
              responseChannel
            , new wire.WifiGetStatusMessage()
            )
          ])
        })
        .on('group.invite', function(channel, responseChannel, data) {
          joinChannel(responseChannel)
          push.send([
            channel
          , wireutil.transaction(
              responseChannel
            , new wire.GroupMessage(
                new wire.OwnerMessage(
                  user.email
                , user.name
                , user.group
                )
              , data.timeout || null
              , wireutil.toDeviceRequirements(data.requirements)
              )
            )
          ])
        })
        .on('group.kick', function(channel, responseChannel, data) {
          joinChannel(responseChannel)
          push.send([
            channel
          , wireutil.transaction(
              responseChannel
            , new wire.UngroupMessage(
                wireutil.toDeviceRequirements(data.requirements)
              )
            )
          ])
        })
        .on('tx.cleanup', function(channel) {
          leaveChannel(channel)
        })
        .on('tx.punch', function(channel) {
          joinChannel(channel)
          socket.emit('tx.punch', channel)
        })
        .on('shell.command', function(channel, responseChannel, data) {
          joinChannel(responseChannel)
          push.send([
            channel
          , wireutil.transaction(
              responseChannel
            , new wire.ShellCommandMessage(data)
            )
          ])
        })
        .on('shell.keepalive', function(channel, data) {
          push.send([
            channel
          , wireutil.envelope(new wire.ShellKeepAliveMessage(data))
          ])
        })
        .on('device.install', function(channel, responseChannel, data) {
          joinChannel(responseChannel)
          push.send([
            channel
          , wireutil.transaction(
              responseChannel
            , new wire.InstallMessage(
                data.href
              , data.launch === true
              , JSON.stringify(data.manifest)
              )
            )
          ])
        })
        .on('device.uninstall', function(channel, responseChannel, data) {
          joinChannel(responseChannel)
          push.send([
            channel
          , wireutil.transaction(
              responseChannel
            , new wire.UninstallMessage(data)
            )
          ])
        })
        .on('storage.upload', function(channel, responseChannel, data) {
          joinChannel(responseChannel)
          request.postAsync({
              url: util.format(
                '%sapi/v1/resources?channel=%s'
              , options.storageUrl
              , responseChannel
              )
            , json: true
            , body: {
                url: data.url
              }
            })
            .catch(function(err) {
              log.error('Storage upload had an error', err.stack)
              leaveChannel(responseChannel)
              socket.emit('tx.cancel', responseChannel, {
                success: false
              , data: 'fail_upload'
              })
            })
        })
        .on('forward.test', function(channel, responseChannel, data) {
          joinChannel(responseChannel)
          if (!data.targetHost || data.targetHost === 'localhost') {
            data.targetHost = user.ip
          }
          push.send([
            channel
          , wireutil.transaction(
              responseChannel
            , new wire.ForwardTestMessage(data)
            )
          ])
        })
        .on('forward.create', function(channel, responseChannel, data) {
          if (!data.targetHost || data.targetHost === 'localhost') {
            data.targetHost = user.ip
          }
          joinChannel(responseChannel)
          push.send([
            channel
          , wireutil.transaction(
              responseChannel
            , new wire.ForwardCreateMessage(data)
            )
          ])
        })
        .on('forward.remove', function(channel, responseChannel, data) {
          joinChannel(responseChannel)
          push.send([
            channel
          , wireutil.transaction(
              responseChannel
            , new wire.ForwardRemoveMessage(data)
            )
          ])
        })
        .on('logcat.start', function(channel, responseChannel, data) {
          joinChannel(responseChannel)
          push.send([
            channel
          , wireutil.transaction(
              responseChannel
            , new wire.LogcatStartMessage(data)
            )
          ])
        })
        .on('logcat.stop', function(channel, responseChannel) {
          joinChannel(responseChannel)
          push.send([
            channel
          , wireutil.transaction(
              responseChannel
            , new wire.LogcatStopMessage()
            )
          ])
        })
        .on('connect.start', function(channel, responseChannel) {
          joinChannel(responseChannel)
          push.send([
            channel
          , wireutil.transaction(
              responseChannel
            , new wire.ConnectStartMessage()
            )
          ])
        })
        .on('connect.stop', function(channel, responseChannel) {
          joinChannel(responseChannel)
          push.send([
            channel
          , wireutil.transaction(
              responseChannel
            , new wire.ConnectStopMessage()
            )
          ])
        })
        .on('browser.open', function(channel, responseChannel, data) {
          joinChannel(responseChannel)
          push.send([
            channel
          , wireutil.transaction(
              responseChannel
            , new wire.BrowserOpenMessage(data)
            )
          ])
        })
        .on('browser.clear', function(channel, responseChannel, data) {
          joinChannel(responseChannel)
          push.send([
            channel
          , wireutil.transaction(
              responseChannel
            , new wire.BrowserClearMessage(data)
            )
          ])
        })
        .on('store.open', function(channel, responseChannel) {
          joinChannel(responseChannel)
          push.send([
            channel
          , wireutil.transaction(
              responseChannel
            , new wire.StoreOpenMessage()
            )
          ])
        })
        .on('screen.capture', function(channel, responseChannel) {
          joinChannel(responseChannel)
          push.send([
            channel
          , wireutil.transaction(
              responseChannel
            , new wire.ScreenCaptureMessage()
            )
          ])
        })
        .on('fs.retrieve', function(channel, responseChannel, data) {
          joinChannel(responseChannel)
          push.send([
            channel
          , wireutil.transaction(
              responseChannel
            , new wire.FileSystemGetMessage(data)
            )
          ])
        })
        .on('fs.list', function(channel, responseChannel, data) {
          joinChannel(responseChannel)
          push.send([
            channel
          , wireutil.transaction(
              responseChannel
            , new wire.FileSystemListMessage(data)
            )
          ])
        })
    })
    .finally(function() {
      // Clean up all listeners and subscriptions
      channelRouter.removeListener(wireutil.global, messageListener)
      channels.forEach(function(channel) {
        channelRouter.removeListener(channel, messageListener)
        sub.unsubscribe(channel)
      })
    })
    .catch(function(err) {
      // Cannot guarantee integrity of client
      log.error(
        'Client had an error, disconnecting due to probable loss of integrity'
      , err.stack
      )

      socket.disconnect(true)
    })
  })

  lifecycle.observe(function() {
    [push, sub].forEach(function(sock) {
      try {
        sock.close()
      }
      catch (err) {
        // No-op
      }
    })
  })

  server.listen(options.port)
  log.info('Listening on port %d', options.port)
}
