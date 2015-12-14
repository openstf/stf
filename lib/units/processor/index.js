var Promise = require('bluebird')

var logger = require('../../util/logger')
var wire = require('../../wire')
var wirerouter = require('../../wire/router')
var wireutil = require('../../wire/util')
var dbapi = require('../../db/api')
var lifecycle = require('../../util/lifecycle')
var srv = require('../../util/srv')
var zmqutil = require('../../util/zmqutil')

module.exports = function(options) {
  var log = logger.createLogger('processor')

  if (options.name) {
    logger.setGlobalIdentifier(options.name)
  }

  // App side
  var appDealer = zmqutil.socket('dealer')
  Promise.map(options.endpoints.appDealer, function(endpoint) {
    return srv.resolve(endpoint).then(function(records) {
      return srv.attempt(records, function(record) {
        log.info('App dealer connected to "%s"', record.url)
        appDealer.connect(record.url)
        return Promise.resolve(true)
      })
    })
  })
  .catch(function(err) {
    log.fatal('Unable to connect to app dealer endpoint', err)
    lifecycle.fatal()
  })

  // Device side
  var devDealer = zmqutil.socket('dealer')

  appDealer.on('message', function(channel, data) {
    devDealer.send([channel, data])
  })

  Promise.map(options.endpoints.devDealer, function(endpoint) {
    return srv.resolve(endpoint).then(function(records) {
      return srv.attempt(records, function(record) {
        log.info('Device dealer connected to "%s"', record.url)
        devDealer.connect(record.url)
        return Promise.resolve(true)
      })
    })
  })
  .catch(function(err) {
    log.fatal('Unable to connect to dev dealer endpoint', err)
    lifecycle.fatal()
  })

  devDealer.on('message', wirerouter()
    // Initial device message
    .on(wire.DeviceIntroductionMessage, function(channel, message, data) {
      dbapi.saveDeviceInitialState(message.serial, message)
        .then(function() {
          devDealer.send([
            message.provider.channel
          , wireutil.envelope(new wire.DeviceRegisteredMessage(
              message.serial
            ))
          ])
          appDealer.send([channel, data])
        })
    })
    // Workerless messages
    .on(wire.DevicePresentMessage, function(channel, message, data) {
      dbapi.setDevicePresent(message.serial)
      appDealer.send([channel, data])
    })
    .on(wire.DeviceAbsentMessage, function(channel, message, data) {
      dbapi.setDeviceAbsent(message.serial)
      appDealer.send([channel, data])
    })
    .on(wire.DeviceStatusMessage, function(channel, message, data) {
      dbapi.saveDeviceStatus(message.serial, message.status)
      appDealer.send([channel, data])
    })
    .on(wire.DeviceHeartbeatMessage, function(channel, message, data) {
      appDealer.send([channel, data])
    })
    // Worker initialized
    .on(wire.DeviceReadyMessage, function(channel, message, data) {
      dbapi.setDeviceReady(message.serial, message.channel)
        .then(function() {
          devDealer.send([
            message.channel
          , wireutil.envelope(new wire.ProbeMessage())
          ])

          appDealer.send([channel, data])
        })
    })
    // Worker messages
    .on(wire.JoinGroupByAdbFingerprintMessage, function(channel, message) {
      dbapi.lookupUserByAdbFingerprint(message.fingerprint)
        .then(function(user) {
          if (user) {
            devDealer.send([
              channel
            , wireutil.envelope(new wire.AutoGroupMessage(
                new wire.OwnerMessage(
                  user.email
                , user.name
                , user.group
                )
              , message.fingerprint
              ))
            ])
          }
          else if (message.currentGroup) {
            appDealer.send([
              message.currentGroup
            , wireutil.envelope(new wire.JoinGroupByAdbFingerprintMessage(
                message.serial
              , message.fingerprint
              , message.comment
              ))
            ])
          }
        })
        .catch(function(err) {
          log.error(
            'Unable to lookup user by ADB fingerprint "%s"'
          , message.fingerprint
          , err.stack
          )
        })
    })
    .on(wire.JoinGroupByVncAuthResponseMessage, function(channel, message) {
      dbapi.lookupUserByVncAuthResponse(message.response, message.serial)
        .then(function(user) {
          if (user) {
            devDealer.send([
              channel
            , wireutil.envelope(new wire.AutoGroupMessage(
                new wire.OwnerMessage(
                  user.email
                , user.name
                , user.group
                )
              , message.response
              ))
            ])
          }
          else if (message.currentGroup) {
            appDealer.send([
              message.currentGroup
            , wireutil.envelope(new wire.JoinGroupByVncAuthResponseMessage(
                message.serial
              , message.response
              ))
            ])
          }
        })
        .catch(function(err) {
          log.error(
            'Unable to lookup user by VNC auth response "%s"'
          , message.response
          , err.stack
          )
        })
    })
    .on(wire.ConnectStartedMessage, function(channel, message, data) {
      dbapi.setDeviceConnectUrl(message.serial, message.url)
      appDealer.send([channel, data])
    })
    .on(wire.ConnectStoppedMessage, function(channel, message, data) {
      dbapi.unsetDeviceConnectUrl(message.serial)
      appDealer.send([channel, data])
    })
    .on(wire.JoinGroupMessage, function(channel, message, data) {
      dbapi.setDeviceOwner(message.serial, message.owner)
      appDealer.send([channel, data])
    })
    .on(wire.LeaveGroupMessage, function(channel, message, data) {
      dbapi.unsetDeviceOwner(message.serial, message.owner)
      appDealer.send([channel, data])
    })
    .on(wire.DeviceLogMessage, function(channel, message, data) {
      appDealer.send([channel, data])
    })
    .on(wire.DeviceIdentityMessage, function(channel, message, data) {
      dbapi.saveDeviceIdentity(message.serial, message)
      appDealer.send([channel, data])
    })
    .on(wire.TransactionProgressMessage, function(channel, message, data) {
      appDealer.send([channel, data])
    })
    .on(wire.TransactionDoneMessage, function(channel, message, data) {
      appDealer.send([channel, data])
    })
    .on(wire.DeviceLogcatEntryMessage, function(channel, message, data) {
      appDealer.send([channel, data])
    })
    .on(wire.AirplaneModeEvent, function(channel, message, data) {
      dbapi.setDeviceAirplaneMode(message.serial, message.enabled)
      appDealer.send([channel, data])
    })
    .on(wire.BatteryEvent, function(channel, message, data) {
      dbapi.setDeviceBattery(message.serial, message)
      appDealer.send([channel, data])
    })
    .on(wire.DeviceBrowserMessage, function(channel, message, data) {
      dbapi.setDeviceBrowser(message.serial, message)
      appDealer.send([channel, data])
    })
    .on(wire.ConnectivityEvent, function(channel, message, data) {
      dbapi.setDeviceConnectivity(message.serial, message)
      appDealer.send([channel, data])
    })
    .on(wire.PhoneStateEvent, function(channel, message, data) {
      dbapi.setDevicePhoneState(message.serial, message)
      appDealer.send([channel, data])
    })
    .on(wire.RotationEvent, function(channel, message, data) {
      dbapi.setDeviceRotation(message.serial, message.rotation)
      appDealer.send([channel, data])
    })
    .on(wire.ReverseForwardsEvent, function(channel, message, data) {
      dbapi.setDeviceReverseForwards(message.serial, message.forwards)
      appDealer.send([channel, data])
    })
    .handler())

  lifecycle.observe(function() {
    [appDealer, devDealer].forEach(function(sock) {
      try {
        sock.close()
      }
      catch (err) {
        // No-op
      }
    })
  })
}
